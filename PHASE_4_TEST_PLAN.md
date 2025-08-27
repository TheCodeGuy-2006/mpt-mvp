# Phase 4: Testing & Validation Plan

## Master Dataset Architecture Test Suite

### Test Overview
This document outlines comprehensive testing for the master dataset implementation that fixes:
1. **Save Issue**: Filtered data being saved instead of complete dataset
2. **Delete Issue**: Deleted rows returning when filters are cleared

### Test Environment Setup
- Browser: Chrome/Safari with Developer Console open
- URL: http://localhost:8000/
- Console Monitoring: Watch for "Phase 1", "Phase 2", "Phase 3" debug messages

## Test Cases

### 1. Master Dataset Initialization Test
**Objective**: Verify master dataset is properly initialized and contains all data

**Steps**:
1. Load planning data
2. Open browser console
3. Run: `planningDebug.showMasterDataSummary()`
4. Run: `planningDebug.showFilteredDataSummary()`

**Expected Results**:
- Master dataset contains all loaded rows
- Filtered data matches master data (no filters applied initially)
- No deleted rows initially

### 2. Filter Independence Test
**Objective**: Verify filters don't affect master dataset

**Steps**:
1. Apply a filter (e.g., specific region or quarter)
2. Note filtered row count in table
3. Run: `planningDebug.showMasterDataSummary()`
4. Run: `planningDebug.showFilteredDataSummary()`

**Expected Results**:
- Master dataset count unchanged
- Filtered data count shows only visible rows
- Console shows difference between master and filtered data

### 3. Save Functionality Test
**Objective**: Verify save uses complete dataset, not just filtered data

**Steps**:
1. Load planning data (ensure multiple rows)
2. Apply a filter to show only some rows
3. Click "Save Planning Rows" button
4. Monitor console output

**Expected Results**:
- Console shows: "Saving master dataset: X rows (vs table: Y visible)" where X > Y
- All data saved, not just filtered rows
- Phase 2 logging appears in console

### 4. Individual Row Delete Test
**Objective**: Verify individual row delete uses master dataset

**Steps**:
1. Load planning data
2. Click delete button (🗑️) on any row
3. Note the row disappears from table
4. Run: `planningDebug.showDeletedRows()`
5. Apply and remove filters
6. Check if deleted row returns

**Expected Results**:
- Row immediately disappears from table
- Console shows "Phase 3: Soft deleted row ID: [id]"
- Deleted row ID appears in deleted rows list
- Deleted row does NOT return when filters are applied/removed

### 5. Mass Delete Test
**Objective**: Verify mass delete functionality with master dataset

**Steps**:
1. Load planning data
2. Select multiple rows (use checkbox selection)
3. Click "Delete Highlighted Rows" button
4. Confirm deletion
5. Run: `planningDebug.showDeletedRows()`
6. Apply various filters and clear them

**Expected Results**:
- All selected rows disappear immediately
- Console shows "Phase 3: Deleted X rows from master dataset"
- Deleted row IDs appear in deleted rows list
- Deleted rows do NOT return when filters are cleared

### 6. Delete All Test
**Objective**: Verify delete all uses master dataset count

**Steps**:
1. Load planning data
2. Apply a filter to show only some rows
3. Click "Delete All Planning Rows" button
4. Note the confirmation message
5. Confirm deletion

**Expected Results**:
- Confirmation shows total master dataset count, not filtered count
- Console shows "Phase 3: Marked X rows as deleted in master dataset"
- All data cleared from table
- Master dataset shows all rows as deleted

### 7. Add Row Integration Test
**Objective**: Verify new rows are added to master dataset

**Steps**:
1. Click "Add Planning Row" button
2. Fill out form with test data
3. Submit form
4. Run: `planningDebug.showMasterDataSummary()`
5. Apply filters to hide the new row
6. Clear filters

**Expected Results**:
- New row appears in table
- Console shows "Phase 3: Added new row to master dataset: [id]"
- Master dataset count increases by 1
- New row persists when filters are applied and cleared

### 8. Complex Filter Scenario Test
**Objective**: Test behavior with multiple filter operations

**Steps**:
1. Load planning data
2. Delete some rows
3. Apply Filter A (e.g., specific region)
4. Delete more rows while filtered
5. Apply Filter B (e.g., specific quarter)
6. Add new row while filtered
7. Clear all filters
8. Run: `planningDebug.showMasterDataSummary()`

**Expected Results**:
- All deleted rows remain deleted regardless of filter state
- New row appears in final result
- Master dataset reflects all operations correctly
- No "zombie rows" (deleted rows returning)

### 9. Save After Filter Operations Test
**Objective**: Verify save works correctly after complex filter operations

**Steps**:
1. Load planning data
2. Apply filters
3. Delete some visible rows
4. Change filters to show different rows
5. Delete more rows
6. Clear filters
7. Click save button
8. Monitor console

**Expected Results**:
- Save processes complete master dataset minus deleted rows
- Console shows correct count difference between master and table
- All legitimate data (not deleted) is saved

### 10. Data Consistency Test
**Objective**: Verify master dataset and table stay in sync

**Steps**:
1. Perform various operations (add, delete, filter)
2. Regularly run: `planningDebug.compareDatasets()`

**Expected Results**:
- Master dataset always contains complete data
- Table display reflects current filter state
- Deleted rows are properly tracked
- No orphaned or missing data

## Debug Commands Reference

### Available Debug Commands:
```javascript
// Show master dataset summary
planningDebug.showMasterDataSummary()

// Show current filtered/table data summary  
planningDebug.showFilteredDataSummary()

// Show deleted rows
planningDebug.showDeletedRows()

// Compare master vs table data
planningDebug.compareDatasets()

// Show detailed master data
planningDebug.showFullMasterData()
```

## Test Results Template

For each test, record:
- ✅ PASS / ❌ FAIL
- Console output
- Any unexpected behavior
- Screenshots if relevant

## Success Criteria

All tests must pass for Phase 4 completion:
- Master dataset maintains data integrity
- Filters don't affect save operations
- Deleted rows stay deleted
- New rows integrate properly
- No data loss or corruption
