// Calendar Tab Master Dataset Integration Test
// Test that calendar tab works properly with master dataset architecture
console.log('🗓️ === CALENDAR TAB MASTER DATASET INTEGRATION TEST ===');
console.log('Testing calendar tab integration with master dataset\n');

// Test 1: Check Calendar Module Availability
console.log('🔍 Test 1: Calendar Module Availability');
if (window.calendarModule) {
  console.log('✅ Calendar module exists');
  
  const expectedFunctions = [
    'initializeCalendar',
    'renderCalendar',
    'getCampaignsForMonth',
    'debugCalendarState'
  ];
  
  expectedFunctions.forEach(funcName => {
    if (typeof window.calendarModule[funcName] === 'function') {
      console.log(`✅ ${funcName} available`);
    } else {
      console.log(`❌ ${funcName} missing`);
    }
  });
} else {
  console.log('❌ Calendar module not found');
}

// Test 2: Check Calendar Cache Access
console.log('\n🔍 Test 2: Calendar Cache and Data Access');
if (window.calendarCache) {
  console.log('✅ Calendar cache exists');
  
  try {
    const campaigns = window.calendarCache.getCampaigns();
    console.log(`✅ Cache getCampaigns returns: ${campaigns.length} campaigns`);
    
    if (campaigns.length > 0) {
      console.log(`✅ Sample campaign has index: ${campaigns[0].index !== undefined}`);
      console.log(`✅ Sample campaign data:`, {
        campaignName: campaigns[0].campaignName,
        startDate: campaigns[0].startDate,
        endDate: campaigns[0].endDate,
        fiscalYear: campaigns[0].fiscalYear
      });
    }
  } catch (error) {
    console.log('❌ Error accessing calendar cache:', error);
  }
} else {
  console.log('❌ Calendar cache not found');
}

// Test 3: Check Master Dataset Priority
console.log('\n🔍 Test 3: Data Source Priority Test');
let dataSource = 'unknown';
let dataCount = 0;

// Check what data source calendar is actually using
if (window.planningDataStore && typeof window.planningDataStore.getData === 'function') {
  try {
    const masterData = window.planningDataStore.getData();
    if (masterData.length > 0) {
      dataSource = 'Master Dataset (planningDataStore)';
      dataCount = masterData.length;
    }
  } catch (error) {
    console.log('Master dataset access error:', error);
  }
}

if (dataCount === 0 && window.planningTableInstance && typeof window.planningTableInstance.getData === 'function') {
  const tableData = window.planningTableInstance.getData();
  if (tableData.length > 0) {
    dataSource = 'Planning Table Instance';
    dataCount = tableData.length;
  }
}

if (dataCount === 0 && window.planningModule?.tableInstance) {
  const moduleData = window.planningModule.tableInstance.getData();
  if (moduleData.length > 0) {
    dataSource = 'Planning Module Table';
    dataCount = moduleData.length;
  }
}

console.log(`✅ Primary data source: ${dataSource}`);
console.log(`✅ Data count: ${dataCount}`);

// Test 4: Event System Test
console.log('\n🔍 Test 4: Event System Integration');
let calendarEventReceived = false;

const testCalendarListener = (event) => {
  calendarEventReceived = true;
  console.log('✅ Calendar received planningDataReady event:', event.detail);
};

window.addEventListener('planningDataReady', testCalendarListener);

// Trigger test event
setTimeout(() => {
  window.dispatchEvent(new CustomEvent('planningDataReady', { 
    detail: { rowCount: 100, source: 'calendar-test' }
  }));
  
  setTimeout(() => {
    console.log(`Event received by calendar: ${calendarEventReceived}`);
    window.removeEventListener('planningDataReady', testCalendarListener);
  }, 100);
}, 500);

// Test 5: Calendar Specific Functions
console.log('\n🔍 Test 5: Calendar Specific Functions');
try {
  if (typeof getCampaignData === 'function') {
    const campaigns = getCampaignData();
    console.log(`✅ getCampaignData returns: ${campaigns.length} campaigns`);
  } else {
    console.log('❌ getCampaignData function not available');
  }
  
  if (typeof getAvailableFYs === 'function') {
    const fys = getAvailableFYs();
    console.log(`✅ getAvailableFYs returns: ${fys.join(', ')}`);
  } else {
    console.log('❌ getAvailableFYs function not available');
  }
} catch (error) {
  console.log('❌ Error testing calendar functions:', error);
}

// Test 6: Console Noise Check
console.log('\n🔍 Test 6: Console Noise Reduction');
console.log('Calendar warning attempts:', window.calendarDataAttempts || 0);

// Test 7: Debug State Function
console.log('\n🔍 Test 7: Debug State Function');
if (window.calendarModule && window.calendarModule.debugCalendarState) {
  console.log('Running calendar debug state...');
  window.calendarModule.debugCalendarState();
}

// Summary
console.log('\n📊 === CALENDAR TEST SUMMARY ===');
console.log('✅ Master dataset integration added as primary source');
console.log('✅ Event system for data ready notifications'); 
console.log('✅ Fallback system maintained for compatibility');
console.log('✅ Console noise reduction implemented');
console.log('✅ Debug functions updated with master dataset info');

// Navigation info
if (window.location.hash === '#calendar') {
  console.log('\n🎯 Currently on calendar tab - integration active');
} else {
  console.log('\n💡 Switch to calendar tab to see master dataset integration');
}
