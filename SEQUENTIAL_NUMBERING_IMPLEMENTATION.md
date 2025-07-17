# Campaign Sequential Numbering Implementation

## Overview
Added sequential numbering (#1, #2, #3, etc.) to replace the removed campaign name column. This provides a simple identifier for each campaign row across all modules.

## Changes Made

### 1. Planning Grid (`planning.js`)
- ✅ Added new sequential number column as the first column
- ✅ Column shows "#" header with auto-calculated row numbers (1, 2, 3...)
- ✅ Set to 50px width, center-aligned, frozen for horizontal scrolling
- ✅ Non-sortable to maintain sequential order

### 2. Execution Grid (`execution.js`)
- ✅ Added identical sequential number column as first column
- ✅ Same formatting and behavior as planning grid
- ✅ Provides consistent numbering across both tables

### 3. Calendar Display (`calendar.js`)
- ✅ Updated all calendar views to show: `Program Type (#1)`, `Program Type (#2)`, etc.
- ✅ Modified `getCampaigns()` to add index numbers to campaign data
- ✅ Applied to month view, detail popups, and compact list view

### 4. ROI Dashboard (`roi.js`)
- ✅ Updated campaign display to show: `1. Program Type`, `2. Program Type`, etc.
- ✅ Modified `getCampaignDataForRoi()` to include `displayName` field with numbering
- ✅ Maintained programType-based sorting for logical organization

### 5. Charts Module (`charts.js`)
- ✅ Updated campaign labels to show: `1. Program Type`, `2. Program Type`, etc.
- ✅ Applied to all chart visualizations

## Technical Implementation

### Column Configuration
```javascript
{
  title: "#",
  field: "rowNumber",
  formatter: function (cell) {
    const row = cell.getRow();
    const table = row.getTable();
    const allRows = table.getRows();
    const index = allRows.indexOf(row);
    return index + 1;
  },
  width: 50,
  hozAlign: "center",
  headerSort: false,
  frozen: true, // Stays visible during horizontal scroll
}
```

### Data Processing
- **Planning/Execution**: Dynamic calculation using row index in table
- **Calendar**: Added `index` property when processing campaign data
- **ROI**: Added `displayName` field with numbering during data mapping
- **Charts**: Prepended index to existing labels

## User Experience

### What Users Will See
- **Planning Grid**: Small "#" column on far left showing 1, 2, 3...
- **Execution Grid**: Matching "#" column for consistency
- **Calendar Events**: "Program Type (#1)", "Program Type (#2)", etc.
- **ROI Dashboard**: "1. Program Type", "2. Program Type", etc.
- **Charts**: Numbered labels in all visualizations

### Benefits
- ✅ Simple visual reference for each campaign
- ✅ Consistent numbering across all modules
- ✅ Frozen column stays visible when scrolling horizontally
- ✅ Auto-updates when rows are added/removed/reordered
- ✅ Minimal space usage (50px width)

### Behavior
- **Dynamic**: Numbers update automatically as rows change
- **Non-editable**: Users cannot modify the sequence numbers
- **Persistent**: Same campaign keeps same number within a session
- **Visual**: Small, unobtrusive column that provides quick reference

## Testing Recommendations

1. **Grid Operations**: Add/delete rows and verify numbering updates
2. **Horizontal Scroll**: Confirm number column stays frozen
3. **Calendar Display**: Check that events show proper numbering
4. **ROI Dashboard**: Verify numbered display in campaign list
5. **Sorting**: Ensure numbers reflect current table order
6. **Multi-Tab**: Check consistency when switching between planning/execution

## Notes

- Numbering is based on current table order (not persistent IDs)
- Numbers will change if rows are reordered or filtered
- Provides simple visual reference without cluttering the interface
- Maintains data synchronization using existing ID-based matching
