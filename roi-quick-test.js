console.log('🔧 ROI Error Fix Test - Inline Version');
console.log('=====================================');

// Test 1: Check roiModule
console.log('\n1️⃣ Testing ROI Module:');
if (typeof window.roiModule !== 'undefined') {
  console.log('✅ roiModule exists');
  if (typeof window.roiModule.updateRoiTotalSpend === 'function') {
    console.log('✅ updateRoiTotalSpend function exists');
  } else {
    console.log('❌ updateRoiTotalSpend missing');
  }
} else {
  console.log('❌ roiModule not found');
}

// Test 2: Check master datasets
console.log('\n2️⃣ Testing Master Datasets:');
if (typeof window.planningDataStore !== 'undefined') {
  console.log('✅ planningDataStore available');
} else {
  console.log('❌ planningDataStore not found');
}

if (typeof window.executionDataStore !== 'undefined') {
  console.log('✅ executionDataStore available'); 
} else {
  console.log('❌ executionDataStore not found');
}

// Test 3: Test data access
console.log('\n3️⃣ Testing Data Access:');
try {
  if (window.planningDataStore) {
    const pData = window.planningDataStore.getData();
    console.log(`✅ Planning data: ${pData.length} rows`);
  }
  if (window.executionDataStore) {
    const eData = window.executionDataStore.getData();
    console.log(`✅ Execution data: ${eData.length} rows`);
  }
} catch (error) {
  console.log('❌ Error accessing data:', error);
}

console.log('\n🎯 Run this script in browser console on ROI tab');
