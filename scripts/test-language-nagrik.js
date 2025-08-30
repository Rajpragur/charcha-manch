#!/usr/bin/env node

// Test script to verify language-based nagrik number display
// This script tests that nagrik numbers display in the correct language

const { getNagrikDisplay } = require('../src/lib/utils');

// Test function to verify language-based nagrik display
function testLanguageBasedNagrikDisplay() {
  console.log('🧪 Testing Language-Based Nagrik Number Display...\n');
  
  const testCases = [
    { nagrikNumber: 1001, isEnglish: false, expected: 'नागरिक_1001' },
    { nagrikNumber: 1001, isEnglish: true, expected: 'Nagrik_1001' },
    { nagrikNumber: 2023, isEnglish: false, expected: 'नागरिक_2023' },
    { nagrikNumber: 2023, isEnglish: true, expected: 'Nagrik_2023' },
    { nagrikNumber: 9999, isEnglish: false, expected: 'नागरिक_9999' },
    { nagrikNumber: 9999, isEnglish: true, expected: 'Nagrik_9999' }
  ];
  
  let allTestsPassed = true;
  
  for (const testCase of testCases) {
    const result = getNagrikDisplay(testCase.nagrikNumber, testCase.isEnglish);
    const passed = result === testCase.expected;
    
    console.log(`📝 Test: ${testCase.nagrikNumber} (${testCase.isEnglish ? 'English' : 'Hindi'})`);
    console.log(`   Expected: ${testCase.expected}`);
    console.log(`   Got:      ${result}`);
    console.log(`   Status:   ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('   ---');
    
    if (!passed) {
      allTestsPassed = false;
    }
  }
  
  console.log('\n🎯 Test Summary:');
  if (allTestsPassed) {
    console.log('✅ All tests passed! Language-based nagrik display is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please check the implementation.');
  }
  
  console.log('\n📋 Expected Behavior:');
  console.log('   - Hindi (isEnglish: false): नागरिक_XXXX');
  console.log('   - English (isEnglish: true): Nagrik_XXXX');
  console.log('   - Both formats should be consistent and properly formatted');
  
  return allTestsPassed;
}

// Test function to verify utility function exports
function testUtilityFunctionExports() {
  console.log('\n🧪 Testing Utility Function Exports...\n');
  
  try {
    // Test if functions are properly exported
    if (typeof getNagrikDisplay === 'function') {
      console.log('✅ getNagrikDisplay function is properly exported');
    } else {
      console.log('❌ getNagrikDisplay function is not properly exported');
      return false;
    }
    
    // Test default behavior (Hindi)
    const defaultResult = getNagrikDisplay(1001);
    if (defaultResult === 'नागरिक_1001') {
      console.log('✅ Default behavior (Hindi) is working correctly');
    } else {
      console.log('❌ Default behavior (Hindi) is not working correctly');
      return false;
    }
    
    console.log('✅ All utility function tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing utility functions:', error);
    return false;
  }
}

// Main test function
function runTests() {
  try {
    console.log('🚀 Starting Language-Based Nagrik Number Tests...\n');
    
    // Test 1: Language-based display logic
    const displayTestsPassed = testLanguageBasedNagrikDisplay();
    
    // Test 2: Utility function exports
    const utilityTestsPassed = testUtilityFunctionExports();
    
    console.log('\n🎉 All Tests Completed!');
    console.log('\n📋 Final Results:');
    console.log(`   - Display Logic Tests: ${displayTestsPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   - Utility Function Tests: ${utilityTestsPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (displayTestsPassed && utilityTestsPassed) {
      console.log('\n🎊 SUCCESS: Language-based nagrik display system is working correctly!');
      console.log('\n📱 Next Steps:');
      console.log('   1. Test in the browser by switching languages');
      console.log('   2. Verify posts show "नागरिक_XXXX" in Hindi');
      console.log('   3. Verify posts show "Nagrik_XXXX" in English');
      console.log('   4. Check that existing content updates when language changes');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Tests failed:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(() => {
    console.log('\nTests finished');
    process.exit(0);
  }).catch((error) => {
    console.error('Tests failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testLanguageBasedNagrikDisplay,
  testUtilityFunctionExports,
  runTests
};
