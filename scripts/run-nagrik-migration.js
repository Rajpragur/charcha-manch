#!/usr/bin/env node

// Simple script to run nagrik number migration for existing users
// Run this from the project root: node scripts/run-nagrik-migration.js

const { migrateExistingUsers, verifyMigration } = require('./migrate-nagrik-numbers');

async function main() {
  try {
    console.log('🚀 Starting Nagrik Number Migration for Existing Users...\n');
    
    // Step 1: Migrate existing users
    await migrateExistingUsers();
    
    // Step 2: Verify results
    await verifyMigration();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('All existing users should now have nagrik numbers assigned.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
