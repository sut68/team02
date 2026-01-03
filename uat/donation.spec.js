const { Builder, By, until, Key } = require('selenium-webdriver');
const fs = require('fs');

async function runFullUAT() {
  let driver = await new Builder().forBrowser('chrome').build();

  // 🛠️ Helper: ฟังก์ชันล้างค่าเดิมและพิมพ์ใหม่ (ป้องกันข้อมูลเบิ้ล)
  async function clearAndType(locator, value) {
    let el = await driver.wait(until.elementLocated(locator), 10000);
    // เทคนิคล้างค่าแบบสะอาดหมดจดสำหรับ React
    await el.sendKeys(Key.chord(Key.CONTROL, "a"), Key.BACK_SPACE); 
    await el.sendKeys(Key.chord(Key.COMMAND, "a"), Key.BACK_SPACE);
    await el.clear();
    await el.sendKeys(value);
    await el.sendKeys(Key.TAB); // กด Tab เพื่อ Trigger Validation
  }

  // 🛠️ Helper: ฟังก์ชันเลือก Radio Button
  async function clickRadio(value) {
    const radio = await driver.findElement(By.css(`input[value="${value}"]`));
    await driver.executeScript("arguments[0].click();", radio);
  }

  try {
    // ==========================================
    // 🔐 STEP 1: LOGIN (เข้าสู่ระบบ)
    // ==========================================
    console.log('\n🔐 --- STEP 1: LOGIN ---');
    await driver.get('http://localhost:3000/auth/login');
    
    await clearAndType(By.name('email'), 'student.2ndyear@g.sut.ac.th');
    await clearAndType(By.name('password'), 'sut12345');
    
    const loginBtn = await driver.findElement(By.css('button[type="submit"]'));
    await loginBtn.click();
    
    await driver.wait(until.urlContains('/user'), 10000);
    console.log('✅ Login Success');

    const donationUrl = 'http://localhost:3000/user/donation/form?projectId=1';

    // ==========================================
    // ✅ STEP 2: POSITIVE CASE (กรอกถูก -> สำเร็จ)
    // ==========================================
    console.log('\n✅ --- STEP 2: POSITIVE TEST ---');
    await driver.get(donationUrl);
    await driver.wait(until.elementLocated(By.id('fullName')), 15000);
    await driver.sleep(1000); // รอโหลดนิดนึง

    // กรอกข้อมูลที่ถูกต้อง
    await clearAndType(By.id('fullName'), 'นายทดสอบ ระบบ');
    await clearAndType(By.id('email'), 'test@example.com');
    await clearAndType(By.id('phone'), '0812345678');
    await clearAndType(By.id('address'), '111 มหาวิทยาลัยเทคโนโลยีสุรนารี');
    await clearAndType(By.id('subdistrict'), 'สุรนารี');
    await clearAndType(By.id('district'), 'เมือง');
    await clearAndType(By.id('province'), 'นครราชสีมา');
    await clearAndType(By.id('postalCode'), '30000');
    await clearAndType(By.id('amount'), '500'); // ยอดเงินถูกต้อง
    await clickRadio('allow');

    // กดปุ่มถัดไป
    console.log('🔘 Clicking Submit (Positive)...');
    const submitBtn = await driver.findElement(By.xpath("//button[contains(text(), 'ถัดไป')]"));
    await driver.executeScript("arguments[0].click();", submitBtn);

    // จัดการ Alert ความสำเร็จ
    try {
        await driver.wait(until.alertIsPresent(), 10000);
        let alert = await driver.switchTo().alert();
        console.log(`🔔 Alert text: "${await alert.getText()}"`);
        await alert.accept(); // กด OK
    } catch (e) {
        console.log('⚠️ No alert appeared, checking redirection...');
    }

    // ตรวจสอบการเปลี่ยนหน้า
    await driver.wait(until.urlContains('/user/payment'), 15000);
    console.log('✅ PASS: Redirected to Payment Page');
    
    // 📸 Capture หลักฐาน Positive
    let posPic = await driver.takeScreenshot();
    fs.writeFileSync('uat-positive-success.png', posPic, 'base64');


    // ==========================================
    // ❌ STEP 3: NEGATIVE CASE (กรอกผิด -> ห้ามไปต่อ)
    // ==========================================
    console.log('\n❌ --- STEP 3: NEGATIVE TEST (Invalid Data) ---');
    
    // กลับมาที่หน้าฟอร์มเดิม
    await driver.get(donationUrl);
    await driver.wait(until.elementLocated(By.id('fullName')), 15000);
    await driver.sleep(1000);

    // กรอกข้อมูล *เกือบ* ถูก แต่เบอร์โทรสั้นเกินไป (เพื่อ Test API Validation)
    await clearAndType(By.id('fullName'), 'นายทดสอบ ข้อมูลผิด');
    await clearAndType(By.id('email'), 'fail@test.com');
    await clearAndType(By.id('phone'), '02'); // ❌ ผิด: สั้นเกินไป (API ต้อง Reject)
    await clearAndType(By.id('postalCode'), '30000');
    await clearAndType(By.id('amount'), '500');
    await clickRadio('anonymous');

    console.log('🔘 Clicking Submit (Negative)...');
    const submitBtnNeg = await driver.findElement(By.xpath("//button[contains(text(), 'ถัดไป')]"));
    await driver.executeScript("arguments[0].scrollIntoView()", submitBtnNeg);
    await driver.executeScript("arguments[0].click();", submitBtnNeg);

    // 🔎 ตรวจสอบผลลัพธ์: ต้อง "ไม่" ไปหน้า Payment และต้องมี Error
    try {
        // รอให้หน้าจอนิ่ง หรือรอ Error Message ปรากฏ
        // สมมติว่า Frontend แสดง Error เป็น Alert หรือ Text สีแดง
        // กรณีนี้เราเช็คว่า URL *ต้องไม่เปลี่ยน* ไปเป็น /payment
        await driver.sleep(3000); // รอ API ตอบกลับ
        
        let currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes('/user/donation/form')) {
            console.log('✅ PASS: System blocked invalid submission (Stayed on Form Page)');
        } else {
            console.error('❌ FAIL: System allowed invalid data to pass!');
        }

        // 📸 Capture หลักฐาน Negative (ควรเห็น Error Message หรือ Alert)
        let negPic = await driver.takeScreenshot();
        fs.writeFileSync('uat-negative-blocked.png', negPic, 'base64');

    } catch (error) {
        console.log('❌ Error during negative test verification:', error);
    }

  } catch (error) {
    console.error('\n💥 CRITICAL TEST FAILURE:', error.message);
    let debugPic = await driver.takeScreenshot();
    fs.writeFileSync('uat-crash-debug.png', debugPic, 'base64');
  } finally {
    console.log('\n🏁 Test Completed.');
    await driver.quit();
  }
}

runFullUAT();