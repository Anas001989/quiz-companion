// Script to update Teacher table: split name into firstName/lastName and add username
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  let teachers = [];
  try {
    console.log('🔄 Updating Teacher table schema...');
    
    // Step 1: Add new columns (nullable first to handle existing data)
    console.log('📝 Step 1: Adding firstName, lastName, and username columns...');
    
    await prisma.$executeRaw`
      ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "username" TEXT;
    `;
    console.log('✅ New columns added');
    
    // Step 2: Migrate existing data
    console.log('📝 Step 2: Migrating existing teacher data...');
    
    // Use raw SQL to fetch teachers that need updating (since Prisma client doesn't know about new fields yet)
    teachers = await prisma.$queryRaw`
      SELECT id, email, name, "firstName", "lastName", username 
      FROM "Teacher" 
      WHERE "firstName" IS NULL OR "lastName" IS NULL OR username IS NULL
    `;
    
    if (teachers.length > 0) {
      console.log(`📋 Found ${teachers.length} teacher(s) to update`);
      
      for (const teacher of teachers) {
        // Split name into firstName and lastName
        let firstName = '';
        let lastName = '';
        
        if (teacher.name) {
          const nameParts = teacher.name.trim().split(/\s+/);
          if (nameParts.length === 1) {
            firstName = nameParts[0];
            lastName = '';
          } else {
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          }
        } else {
          firstName = 'Teacher';
          lastName = '';
        }
        
        // Generate username from email if not set
        let username = '';
        if (teacher.username) {
          username = teacher.username;
        } else {
          // Extract username from email (part before @)
          const emailParts = teacher.email.split('@');
          let baseUsername = emailParts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // Check if username already exists using raw SQL
          let finalUsername = baseUsername;
          let counter = 1;
          while (true) {
            const existing = await prisma.$queryRaw`
              SELECT id FROM "Teacher" WHERE username = ${finalUsername} AND id != ${teacher.id}
            `;
            if (existing.length === 0) {
              break;
            }
            finalUsername = `${baseUsername}${counter}`;
            counter++;
          }
          username = finalUsername;
        }
        
        // Update using raw SQL
        await prisma.$executeRaw`
          UPDATE "Teacher" 
          SET "firstName" = ${firstName}, 
              "lastName" = ${lastName}, 
              username = ${username}
          WHERE id = ${teacher.id}
        `;
        
        console.log(`✅ Updated teacher: ${teacher.email}`);
        console.log(`   - firstName: ${firstName}`);
        console.log(`   - lastName: ${lastName}`);
        console.log(`   - username: ${username}`);
      }
    } else {
      console.log('✅ No existing teachers to update');
    }
    
    // Step 3: Make columns required and add unique constraint
    console.log('📝 Step 3: Making columns required and adding constraints...');
    
    await prisma.$executeRaw`
      ALTER TABLE "Teacher" ALTER COLUMN "firstName" SET NOT NULL;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Teacher" ALTER COLUMN "lastName" SET NOT NULL;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "Teacher" ALTER COLUMN "username" SET NOT NULL;
    `;
    
    // Add unique constraint on username (if not already exists)
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "Teacher_username_key" ON "Teacher"("username");
    `;
    
    console.log('✅ Columns are now required and username is unique');
    
    // Step 4: Remove old name column (optional - you can keep it for backward compatibility)
    // Uncomment if you want to remove the name column:
    // await prisma.$executeRaw`
    //   ALTER TABLE "Teacher" DROP COLUMN IF EXISTS "name";
    // `;
    // console.log('✅ Removed old name column');
    
    console.log('');
    console.log('🎉 Schema update completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - Added firstName, lastName, and username columns');
    if (teachers.length > 0) {
      console.log(`   - Updated ${teachers.length} existing teacher(s)`);
    }
    console.log('   - All columns are now required');
    console.log('   - Username has unique constraint');
    
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

