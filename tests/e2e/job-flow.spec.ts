import { test, expect } from './fixtures';
import { createTestJobData } from './utils/test-data';
import { PrismaClient } from '@prisma/client';

test.describe('Job Management Flow', () => {
  // Set timeout for this test suite
  test.setTimeout(60000); // 1 minute

  test('Complete job flow: create → approve → view → detail', async ({
    userPage,
    adminPage,
    testContainer,
  }) => {
    const jobData = createTestJobData();
    let jobId: number | null = null;

    await test.step('User creates job', async () => {
      await userPage.goto('/user/job/create', {
        waitUntil: 'domcontentloaded',
      });
      await userPage.waitForLoadState('networkidle', { timeout: 10000 });

      // Wait for the form to be visible
      await userPage.waitForSelector('label:has-text("ชื่อหัวข้อของงาน")', {
        timeout: 5000,
      });

      // Fill job title (ชื่อหัวข้อของงาน) - required
      const jobTitleInput = userPage
        .locator('label:has-text("ชื่อหัวข้อของงาน")')
        .locator('..')
        .locator('input');
      await jobTitleInput.waitFor({ state: 'visible', timeout: 5000 });
      await jobTitleInput.fill(jobData.jobTitle);

      // Fill title
      const titleInput = userPage
        .locator('label:has-text("title")')
        .locator('..')
        .locator('input');
      await titleInput.fill(jobData.jobName);

      // Fill position (ตำแหน่งงาน)
      const positionInput = userPage
        .locator('label:has-text("ตำแหน่งงาน")')
        .locator('..')
        .locator('input');
      await positionInput.fill(jobData.position);

      // Select job type (ประเภทของงาน)
      const jobTypeSelect = userPage
        .locator('label:has-text("ประเภทของงาน")')
        .locator('..')
        .locator('select');
      await jobTypeSelect.selectOption('Full-time');

      // Select education (ระดับการศึกษา)
      const educationSelect = userPage
        .locator('label:has-text("ระดับการศึกษา")')
        .locator('..')
        .locator('select');
      await educationSelect.selectOption('ปริญญาตรี');

      // Fill salary (รายได้เฉลี่ย)
      const salaryInput = userPage
        .locator('label:has-text("รายได้เฉลี่ย")')
        .locator('..')
        .locator('input');
      await salaryInput.fill(jobData.salaryDetail);

      // Fill company name (ชื่อบริษัท)
      const companyNameInput = userPage
        .locator('label:has-text("ชื่อบริษัท")')
        .locator('..')
        .locator('input');
      await companyNameInput.fill(jobData.companyName);

      // Fill positions (จำนวนอัตรา)
      const positionsInput = userPage
        .locator('label:has-text("จำนวนอัตรา")')
        .locator('..')
        .locator('input');
      await positionsInput.fill(jobData.numPositions.toString());

      // Fill company address (ที่อยู่บริษัท)
      const addressTextarea = userPage
        .locator('label:has-text("ที่อยู่บริษัท")')
        .locator('..')
        .locator('textarea');
      await addressTextarea.fill(jobData.companyAddress);

      // Fill contact (ช่องทางการติดต่อ)
      const contactTextarea = userPage
        .locator('label:has-text("ช่องทางการติดต่อ")')
        .locator('..')
        .locator('textarea');
      await contactTextarea.fill(jobData.contactInfo);

      // Fill qualifications (คุณสมบัติ)
      const qualificationsTextarea = userPage
        .locator('label:has-text("คุณสมบัติ")')
        .locator('..')
        .locator('textarea');
      await qualificationsTextarea.fill(jobData.qualification);

      await userPage.click('button:has-text("บันทึก")');
      await userPage.waitForURL('/user/job', { timeout: 10000 });
      expect(userPage.url()).toContain('/user/job');

      const db = new PrismaClient({
        datasources: { db: { url: testContainer } },
      });
      // @ts-expect-error - Prisma types don't work with dynamic datasources
      const createdJob = await db.jobPosting.findFirst({
        where: {
          title: jobData.jobTitle,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(createdJob).toBeTruthy();
      jobId = createdJob!.id;
      await db.$disconnect();

      console.log(`✅ Job created with ID: ${jobId}`);
    });

    await test.step('Admin approves job', async () => {
      await adminPage.goto('/admin/job');
      await adminPage.waitForLoadState('networkidle', { timeout: 10000 });

      // Wait for the table to load
      await adminPage.waitForSelector('table', { timeout: 5000 });

      // Debug: Check if job exists in database
      console.log(
        `Looking for job with title: "${jobData.jobTitle}" and ID: ${jobId}`
      );

      // Wait for the job row to appear (it might take a moment to load)
      const jobRow = adminPage.locator(`tr:has-text("${jobData.jobTitle}")`);

      try {
        await expect(jobRow).toBeVisible({ timeout: 10000 });
      } catch {
        // Debug: Take screenshot and log page content
        await adminPage.screenshot({ path: 'admin-job-list-error.png' });
        const pageContent = await adminPage.content();
        console.log('Page HTML:', pageContent.substring(0, 1000));
        throw new Error(
          `Job not found in admin list. Title: "${jobData.jobTitle}"`
        );
      }

      // Find and click the edit button
      const editButton = jobRow
        .locator('button[title="ดูรายละเอียด"]')
        .or(jobRow.locator('a[href*="/admin/job/edit/"]'));
      await editButton.click();

      await adminPage.waitForURL(/\/admin\/job\/edit\/\d+/, { timeout: 5000 });

      // Click the "อนุมัติแล้ว" (Approved) button
      const approveButton = adminPage.getByRole('button', {
        name: 'อนุมัติแล้ว',
      });
      await approveButton.click();

      // Click save button - use getByRole to avoid strict mode violations
      const saveButton = adminPage.getByRole('button', { name: 'บันทึก' });
      await saveButton.click();

      await adminPage.waitForURL('/admin/job', { timeout: 5000 });
      expect(adminPage.url()).toContain('/admin/job');

      console.log(`✅ Job ${jobId} approved by admin`);
    });

    await test.step('User sees approved job', async () => {
      await userPage.goto('/user/job');
      await userPage.waitForLoadState('networkidle');

      const approvedJob = userPage.locator(`text=${jobData.jobTitle}`).first();
      await expect(approvedJob).toBeVisible({ timeout: 5000 });

      console.log(`✅ Approved job visible in user job list`);
    });

    await test.step('Public job detail view', async () => {
      await userPage.goto(`/user/job/detail/${jobId}`);
      await userPage.waitForLoadState('networkidle');

      const titleElement = userPage.locator('h1').first();
      const titleText = await titleElement.textContent();

      const normalizedTitle = titleText?.toLowerCase() || '';
      const expectedTitle = jobData.jobTitle.toLowerCase();

      expect(normalizedTitle.includes(expectedTitle)).toBeTruthy();

      // Check company name is visible
      const companyName = userPage
        .locator(`text=${jobData.companyName}`)
        .first();
      await expect(companyName).toBeVisible({ timeout: 5000 });

      // Check salary detail is visible
      const salaryText = userPage
        .locator(`text=${jobData.salaryDetail}`)
        .first();
      await expect(salaryText).toBeVisible({ timeout: 5000 });

      console.log(`✅ Job detail page displays correct information`);
    });
  });
});
