// Script to add password column and set password for existing teacher
const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔐 Adding password column to Teacher table...');
    
    // Step 1: Add password column as nullable
    await prisma.$executeRaw`
      ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "password" TEXT;
    `;
    console.log('✅ Password column added');
    
    // Step 2: Get existing teachers
    const teachers = await prisma.teacher.findMany({
      where: {
        password: null
      }
    });
    
    if (teachers.length > 0) {
      console.log(`📝 Found ${teachers.length} teacher(s) without passwords`);
      
      // Generate password hash
      const tempPassword = 'temp123456';
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      // Update each teacher with the password
      for (const teacher of teachers) {
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { password: hashedPassword }
        });
        console.log(`✅ Set password for teacher: ${teacher.email}`);
        console.log(`   Temporary password: ${tempPassword}`);
        console.log(`   ⚠️  Teacher should change this password after first login!`);
      }
    }
    
    // Step 3: Make password required
    await prisma.$executeRaw`
      ALTER TABLE "Teacher" ALTER COLUMN "password" SET NOT NULL;
    `;
    console.log('✅ Password column is now required');
    
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - Password column added');
    if (teachers.length > 0) {
      console.log(`   - ${teachers.length} teacher(s) updated with temporary password: temp123456`);
      console.log('   - Teachers should change their password after first login');
    }
    console.log('   - Password field is now required');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

