# Phase 4: Manual Testing Guide

## Quick Start Testing

### 1. Load the Test Suite
1. Open browser to http://localhost:8000/
2. Open Developer Console (F12)
3. Load test script:
```javascript
// Copy and paste the entire content of phase4-test-suite.js into console
// OR load it by adding this to console:
fetch('phase4-test-suite.js').then(r => r.text()).then(eval);
```

### 2. Run Automated Tests
```javascript
// Run the full automated test suite
runPhase4Tests();

// Or run individual debug commands
runDebugCommands();
```

## Manual Test Scenarios

### Scenario A: Filter + Save Test
**Purpose**: Verify save uses complete dataset, not filtered data

1. Load planning data
2. Note total row count: `planningDebug.showMasterDataSummary()`
3. Apply a filter (Region, Quarter, etc.) to show fewer rows
4. Note filtered count in table
5. Click "Save Planning Rows" button
6. **Expected**: Console shows "Saving master dataset: X rows (vs table: Y visible)" where X > Y

### Scenario B: Delete + Filter Test  
**Purpose**: Verify deleted rows don't return when filters change

1. Load planning data
2. Delete a specific row (note its details)
3. Apply various filters 
4. Clear all filters
5. **Expected**: Deleted row should NOT reappear
6. Verify: `planningDebug.showDeletedRows()` should show the deleted row ID

### Scenario C: Complex Operations Test
**Purpose**: Test multiple operations in sequence

1. Load data: `planningDebug.showMasterDataSummary()`
2. Apply Filter A (e.g., specific region)
3. Delete 2-3 visible rows
4. Apply Filter B (e.g., specific quarter) 
5. Add a new row via "Add Planning Row"
6. Delete 1 more row
7. Clear all filters
8. Check final state: `planningDebug.compareDatasets()`
9. **Expected**: 
   - New row appears
   - All deleted rows stay deleted
   - Master dataset reflects all changes

### Scenario D: Save After Complex Operations
**Purpose**: Verify save works correctly after mixed operations

1. Perform Scenario C operations
2. Click "Save Planning Rows"
3. **Expected**: 
   - Save processes complete master dataset minus deleted rows
   - Console shows correct master vs table count difference
   - "Phase 2" logs appear

## Debug Commands Quick Reference

```javascript
// Show master dataset info
planningDebug.showMasterDataSummary()

// Show table/filtered data info  
planningDebug.showFilteredDataSummary()

// Show which rows are soft-deleted
planningDebug.showDeletedRows()

// Compare master vs table data
planningDebug.compareDatasets()

// Show full master dataset (detailed)
planningDebug.showFullMasterData()

// Manual operations for testing
planningDataStore.deleteRow('row-id-here')
planningDataStore.addRow({id: 'test-123', /* other fields */})
planningDataStore.getData() // Get active data
```

## Expected Console Output Examples

### Successful Save (Phase 2):
```
=== PHASE 2: Using Master Dataset for Save ===
Saving master dataset: 45 rows (vs table: 12 visible)
Phase 2: Save using complete dataset
```

### Successful Delete (Phase 3):
```
=== PHASE 3: Using Master Dataset for Delete ===
Phase 3: Soft deleted row ID: program-123456
Phase 3: Deleted 1 rows from master dataset
```

### Debug Output:
```
📊 Master Dataset Summary:
  Total rows: 45
  Active rows: 42  
  Deleted rows: 3
  
🗑️ Deleted Row IDs: program-123, program-456, program-789
```

## Troubleshooting

### If tests fail:
1. **planningDataStore not found**: Reload page, ensure planning tab is loaded
2. **planningDebug not found**: Check if debug utilities loaded with Phase 1
3. **No data**: Make sure planning data is loaded before testing
4. **Inconsistent counts**: Check for JavaScript errors in console

### Common Issues:
- **Filters not working**: Clear browser cache, reload
- **Delete not persistent**: Check console for Phase 3 logs
- **Save includes filtered data**: Check console for Phase 2 logs

## Success Criteria ✅

All of these should work correctly:

1. ✅ **Save Function**: Saves complete dataset regardless of filters
2. ✅ **Delete Persistence**: Deleted rows stay deleted when filters change  
3. ✅ **Add Row Integration**: New rows added to master dataset
4. ✅ **Filter Independence**: Filters don't affect data operations
5. ✅ **Data Consistency**: Master dataset stays in sync with operations

## Performance Notes

The master dataset approach should:
- Handle 1000+ rows efficiently
- Not cause UI freezing during operations
- Maintain responsive filtering
- Complete saves within reasonable time

If performance issues occur, check console for batch processing logs and timing information.
