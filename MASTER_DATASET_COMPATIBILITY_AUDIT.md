# Master Dataset Compatibility Audit & Update Plan

## 🔍 Current Data Access Patterns

### 📊 **Budgets Tab** (`budgets.js`)
**Data Dependencies**: LOW - primarily uses its own data
- ✅ Uses own table data: `table.getData()`, `window.budgetsTableInstance.getData()`
- ❓ **Risk Level**: MINIMAL - independent of planning/execution master datasets

### 📅 **Calendar Tab** (`calendar.js`) 
**Data Dependencies**: HIGH - heavily relies on planning data
**Current Access Pattern**:
```javascript
// Multiple fallback patterns for planning data
if (window.planningTableInstance && typeof window.planningTableInstance.getData === 'function') {
  rawCampaigns = window.planningTableInstance.getData() || [];
} else if (window.planningModule?.tableInstance && typeof window.planningModule.tableInstance.getData === 'function') {
  rawCampaigns = window.planningModule.tableInstance.getData() || [];
} else if (window.planningDataCache && Array.isArray(window.planningDataCache)) {
  rawCampaigns = window.planningDataCache;
}
```
- ❗ **Risk Level**: HIGH - uses table.getData() instead of master dataset
- 🔧 **Action Required**: Update to use `window.planningDataStore.getData()`

### 💰 **ROI Tab** (`roi.js`)
**Data Dependencies**: CRITICAL - uses both planning and execution data
**Current Access Pattern**:
```javascript
// Planning data access
const planningData = window.planningModule.tableInstance.getData();

// Execution data access  
const allData = window.executionModule.tableInstance.getData();
filteredData = window.executionModule.tableInstance.getData();
```
- ❗ **Risk Level**: CRITICAL - uses filtered table data instead of master datasets
- 🔧 **Action Required**: Update to use both master datasets

## 🎯 Update Priority

### **COMPLETED: ROI Tab** ✅
- **Status**: Master dataset integration complete
- **Primary Data Access**: `window.planningDataStore.getData()` and `window.executionDataStore.getData()`
- **Fallback Pattern**: Table instances → Direct table access → Empty array
- **Functionality**: Financial calculations, budget analysis, chart generation
- **Benefits**: Complete data access regardless of table filters, improved accuracy

### **COMPLETED: Calendar Tab** ✅  
- **Status**: Master dataset integration complete
- **Primary Data Access**: `window.planningDataStore.getData()` with fallback chain
- **Event Integration**: Listens for `planningDataReady` events for automatic updates
- **Functionality**: Campaign visualization, fiscal year navigation, calendar rendering
- **Benefits**: Shows all campaigns regardless of planning tab filters, real-time updates

### **COMPLETED: Budgets Tab** ✅
- **Status**: Compatibility verified and enhanced
- **Independence**: Maintains independent data source (budgets.json via Worker API)
- **Cross-module Integration**: Enhanced ROI-Budgets data consistency
- **Cache Coordination**: Improved cache management between ROI and Budgets
- **Benefits**: No conflicts with master dataset architecture, improved data consistency

## 🚀 Implementation Plan

### **Phase A**: ROI Tab Master Dataset Integration
1. Replace `window.planningModule.tableInstance.getData()` → `window.planningDataStore.getData()`
2. Replace `window.executionModule.tableInstance.getData()` → `executionDataStore.getData()`
3. Add error handling for master dataset availability
4. Test financial calculations with complete datasets

### **Phase B**: Calendar Tab Master Dataset Integration ✅ 
1. ✅ Add master dataset access as primary data source
2. ✅ Keep existing fallbacks for backward compatibility  
3. ✅ Update to use `window.planningDataStore.getData()` as first choice
4. ✅ Add event system for real-time data updates
5. ✅ Test calendar visualization with master dataset

### **Phase C**: Budgets Tab Compatibility Check ✅
1. ✅ Verify no conflicts with master dataset architecture
2. ✅ Ensure budget calculations remain independent  
3. ✅ Enhance ROI-Budgets data consistency
4. ✅ Improve cache coordination between modules
5. ✅ Test cross-tab interactions

## 🧪 Testing Strategy

### **Validation Tests**:
1. **Data Consistency**: Verify all tabs see the same underlying data
2. **Filter Independence**: Ensure tabs get complete data regardless of filters
3. **Cross-Tab Sync**: Test that changes propagate correctly
4. **Performance**: Verify no degradation from master dataset usage

### **Critical Test Scenarios**:
- ROI calculations with filtered planning/execution tables
- Calendar display with deleted/hidden planning rows  
- Budget calculations during cross-tab operations
- Real-time updates across all tabs

## 🎯 Success Criteria

✅ **ROI tab calculations include all data regardless of table filters**
✅ **Calendar shows complete campaign timeline from master dataset**  
✅ **Budgets remain independent and functional**
✅ **All tabs maintain data consistency**
✅ **No performance degradation**
✅ **Robust error handling for missing master datasets**
