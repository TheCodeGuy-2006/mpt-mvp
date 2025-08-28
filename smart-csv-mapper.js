// Smart CSV Column Mapping for Planning Grid
// This module provides intelligent column mapping that matches CSV headers to grid columns
// regardless of column order or minor naming variations

class SmartCSVMapper {
  constructor() {
    // Define all possible field mappings with variations and aliases
    this.fieldMappings = {
      // Program/Campaign Type
      programType: {
        aliases: [
          'campaignType', 'campaign_type', 'campaign type', 'program type', 'program_type',
          'type', 'category', 'programtype', 'campaigntype', 'initiative type',
          'initiative_type', 'initiative-type', 'motion type', 'motion_type'
        ],
        required: false,
        defaultValue: 'Digital Motion'
      },
      
      // Strategic Pillars
      strategicPillars: {
        aliases: [
          'strategic pillars', 'strategic_pillars', 'strategic-pillars', 'pillars',
          'pillar', 'strategic pillar', 'strategic_pillar', 'strategic-pillar',
          'focus area', 'focus_area', 'focus-area', 'strategic focus'
        ],
        required: false,
        defaultValue: ''
      },
      
      // Revenue Play
      revenuePlay: {
        aliases: [
          'revenue play', 'revenue_play', 'revenue-play', 'revenueplay',
          'revenue stream', 'revenue_stream', 'revenue-stream', 'play',
          'business play', 'business_play'
        ],
        required: false,
        defaultValue: ''
      },
      
      // Fiscal Year
      fiscalYear: {
        aliases: [
          'fiscal year', 'fiscal_year', 'fiscal-year', 'fy', 'year',
          'fiscalyear', 'financial year', 'financial_year', 'fin_year'
        ],
        required: false,
        defaultValue: new Date().getFullYear()
      },
      
      // Quarter/Month
      quarter: {
        aliases: [
          'quarter', 'quarterMonth', 'quarter_month', 'quarter-month',
          'qtr', 'q', 'fiscal quarter', 'fiscal_quarter', 'period',
          'quarter month', 'quarter/month'
        ],
        required: false,
        defaultValue: 'Q1',
        // Special handling for combined quarter + month columns
        combinedColumns: {
          quarterColumn: ['quarter', 'qtr', 'q', 'fiscal quarter', 'fiscal_quarter'],
          monthColumn: ['month', 'months', 'delivery month', 'delivery_month', 'target month', 'target_month', 'launch month', 'launch_month']
        }
      },
      
      // Region
      region: {
        aliases: [
          'region', 'area', 'territory', 'geographic region', 'geo',
          'geographic_region', 'geographic-region', 'market region',
          'market_region', 'sales region', 'sales_region'
        ],
        required: false,
        defaultValue: 'Global'
      },
      
      // Country
      country: {
        aliases: [
          'country', 'nation', 'geography', 'geo', 'location',
          'market', 'territory country', 'country/region'
        ],
        required: false,
        defaultValue: 'Global'
      },
      
      // Owner
      owner: {
        aliases: [
          'owner', 'responsible', 'lead', 'manager', 'contact',
          'point of contact', 'poc', 'campaign owner', 'campaign_owner',
          'responsible person', 'responsible_person', 'assignee'
        ],
        required: false,
        defaultValue: 'Unassigned'
      },
      
      // Description
      description: {
        aliases: [
          'description', 'desc', 'details', 'campaign description',
          'campaign_description', 'campaign-description', 'summary',
          'overview', 'notes', 'campaign details', 'campaign_details'
        ],
        required: false,
        defaultValue: ''
      },
      
      // Forecasted Cost
      forecastedCost: {
        aliases: [
          'forecasted cost', 'forecasted_cost', 'forecasted-cost',
          'forecast cost', 'forecast_cost', 'cost', 'budget',
          'estimated cost', 'estimated_cost', 'investment',
          'spend', 'allocation', 'forecastedcost'
        ],
        required: false,
        defaultValue: 0,
        isNumeric: true,
        allowDecimals: true
      },
      
      // Expected Leads
      expectedLeads: {
        aliases: [
          'expected leads', 'expected_leads', 'expected-leads',
          'leads', 'target leads', 'target_leads', 'forecasted leads',
          'forecasted_leads', 'lead target', 'lead_target',
          'expectedleads', 'projected leads', 'projected_leads'
        ],
        required: false,
        defaultValue: 0,
        isNumeric: true,
        allowDecimals: true
      },
      
      // MQL Forecast
      mqlForecast: {
        aliases: [
          'mql forecast', 'mql_forecast', 'mql-forecast', 'mqlforecast',
          'forecasted mql', 'forecasted_mql', 'forecasted-mql',
          'expected mql', 'expected_mql', 'expected-mql',
          'mql target', 'mql_target', 'mql-target',
          'marketing qualified leads', 'marketing_qualified_leads',
          'projected mql', 'projected_mql', 'target mql', 'target_mql'
        ],
        required: false,
        defaultValue: 0,
        isNumeric: true,
        allowDecimals: true
      },
      
      // Pipeline Forecast
      pipelineForecast: {
        aliases: [
          'pipeline forecast', 'pipeline_forecast', 'pipeline-forecast',
          'forecasted pipeline', 'forecasted_pipeline', 'forecasted-pipeline',
          'expected pipeline', 'expected_pipeline', 'expected-pipeline',
          'pipeline target', 'pipeline_target', 'pipeline-target',
          'projected pipeline', 'projected_pipeline', 'target pipeline', 'target_pipeline',
          'sales pipeline', 'sales_pipeline', 'revenue pipeline', 'revenue_pipeline'
        ],
        required: false,
        defaultValue: 0,
        isNumeric: true,
        allowDecimals: true
      },
      
      // Status
      status: {
        aliases: [
          'status', 'state', 'phase', 'stage', 'progress',
          'campaign status', 'campaign_status', 'current status',
          'current_status', 'execution status', 'execution_status'
        ],
        required: false,
        defaultValue: 'Planning'
      },
      
      // Digital Motions flag
      digitalMotions: {
        aliases: [
          'digital motions', 'digital_motions', 'digital-motions',
          'dm', 'digital', 'is digital', 'is_digital', 'digital flag',
          'digital_flag', 'digitalmotions'
        ],
        required: false,
        defaultValue: false,
        isBoolean: true
      }
    };
  }

  // Normalize column names for better matching
  normalizeColumnName(name) {
    if (!name) return '';
    return name.toString()
      .toLowerCase()
      .trim()
      .replace(/[\s_-]+/g, ' ')  // Replace underscores, hyphens with spaces
      .replace(/[^\w\s]/g, '')   // Remove special characters
      .trim();
  }

  // Find the best match for a CSV column header
  findBestMatch(csvHeader, usedMappings = new Set()) {
    const normalizedHeader = this.normalizeColumnName(csvHeader);
    
    // Direct field name match
    for (const [fieldName, config] of Object.entries(this.fieldMappings)) {
      if (usedMappings.has(fieldName)) continue;
      
      const normalizedFieldName = this.normalizeColumnName(fieldName);
      if (normalizedHeader === normalizedFieldName) {
        return { fieldName, confidence: 1.0, matchType: 'exact' };
      }
    }
    
    // Alias match
    for (const [fieldName, config] of Object.entries(this.fieldMappings)) {
      if (usedMappings.has(fieldName)) continue;
      
      for (const alias of config.aliases) {
        const normalizedAlias = this.normalizeColumnName(alias);
        if (normalizedHeader === normalizedAlias) {
          return { fieldName, confidence: 0.9, matchType: 'alias' };
        }
      }
    }
    
    // Partial match (contains)
    for (const [fieldName, config] of Object.entries(this.fieldMappings)) {
      if (usedMappings.has(fieldName)) continue;
      
      const normalizedFieldName = this.normalizeColumnName(fieldName);
      if (normalizedHeader.includes(normalizedFieldName) || normalizedFieldName.includes(normalizedHeader)) {
        return { fieldName, confidence: 0.7, matchType: 'partial' };
      }
      
      for (const alias of config.aliases) {
        const normalizedAlias = this.normalizeColumnName(alias);
        if (normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)) {
          return { fieldName, confidence: 0.6, matchType: 'partial_alias' };
        }
      }
    }
    
    return null;
  }

  // Analyze CSV headers and create mapping
  analyzeCSVHeaders(csvHeaders) {
    const mapping = {};
    const usedMappings = new Set();
    const unmappedHeaders = [];
    const confidence = {};
    const combinedColumnMappings = {};

    console.log('🔍 Analyzing CSV headers for smart mapping...');
    console.log('Headers found:', csvHeaders);

    // First, check for combined column patterns (like quarter + month)
    this.detectCombinedColumns(csvHeaders, combinedColumnMappings);

    for (const header of csvHeaders) {
      // Skip headers that are part of combined column mappings
      if (this.isPartOfCombinedMapping(header, combinedColumnMappings)) {
        console.log(`🔗 Header "${header}" is part of combined column mapping, skipping individual mapping`);
        continue;
      }

      const match = this.findBestMatch(header, usedMappings);
      
      if (match) {
        mapping[header] = match.fieldName;
        confidence[header] = match.confidence;
        usedMappings.add(match.fieldName);
        
        console.log(`✅ Mapped "${header}" → "${match.fieldName}" (${match.matchType}, confidence: ${match.confidence})`);
      } else {
        unmappedHeaders.push(header);
        console.log(`⚠️ Could not map header: "${header}"`);
      }
    }

    // Add combined column mappings
    Object.assign(mapping, combinedColumnMappings);

    // Show summary
    console.log(`📊 Mapping summary: ${Object.keys(mapping).length} mapped, ${unmappedHeaders.length} unmapped`);
    
    return {
      mapping,
      confidence,
      unmappedHeaders,
      combinedColumnMappings,
      summary: {
        totalHeaders: csvHeaders.length,
        mappedHeaders: Object.keys(mapping).length,
        unmappedHeaders: unmappedHeaders.length,
        averageConfidence: Object.values(confidence).reduce((sum, conf) => sum + conf, 0) / Object.keys(confidence).length || 0
      }
    };
  }

  // Detect combined column patterns
  detectCombinedColumns(csvHeaders, combinedColumnMappings) {
    console.log('🔗 Checking for combined column patterns...');
    
    // Check for quarter + month combination
    const quarterHeaders = [];
    const monthHeaders = [];
    
    for (const header of csvHeaders) {
      const normalizedHeader = this.normalizeColumnName(header);
      
      // Check if it's a quarter column
      const quarterConfig = this.fieldMappings.quarter.combinedColumns.quarterColumn;
      if (quarterConfig.some(alias => this.normalizeColumnName(alias) === normalizedHeader)) {
        quarterHeaders.push(header);
      }
      
      // Check if it's a month column
      const monthConfig = this.fieldMappings.quarter.combinedColumns.monthColumn;
      if (monthConfig.some(alias => normalizedHeader.includes(this.normalizeColumnName(alias)))) {
        monthHeaders.push(header);
      }
    }
    
    // If we found both quarter and month columns, create combined mapping
    if (quarterHeaders.length > 0 && monthHeaders.length > 0) {
      const quarterHeader = quarterHeaders[0]; // Use first match
      const monthHeader = monthHeaders[0]; // Use first match
      
      combinedColumnMappings[`${quarterHeader}+${monthHeader}`] = {
        targetField: 'quarter',
        type: 'combined',
        sourceColumns: [quarterHeader, monthHeader],
        combineFunction: 'quarterMonth'
      };
      
      console.log(`🎯 Found combined quarter+month pattern: "${quarterHeader}" + "${monthHeader}" → quarter`);
    }
  }

  // Check if a header is part of a combined mapping
  isPartOfCombinedMapping(header, combinedColumnMappings) {
    for (const mapping of Object.values(combinedColumnMappings)) {
      if (mapping.sourceColumns && mapping.sourceColumns.includes(header)) {
        return true;
      }
    }
    return false;
  }

  // Process a single row using the mapping
  processRow(csvRow, mapping, combinedColumnMappings = {}) {
    const mappedRow = {};
    
    // Apply simple mappings first
    for (const [csvHeader, fieldName] of Object.entries(mapping)) {
      // Skip combined column mappings (they have special format)
      if (fieldName && typeof fieldName === 'string' && !csvHeader.includes('+')) {
        let value = csvRow[csvHeader];
        const fieldConfig = this.fieldMappings[fieldName];
        
        // Clean and convert the value
        value = this.cleanValue(value, fieldConfig);
        
        // Only set if we have a meaningful value
        if (value !== null && value !== undefined && value !== '') {
          mappedRow[fieldName] = value;
        }
      }
    }

    // Handle combined column mappings
    for (const [combinedKey, combineConfig] of Object.entries(combinedColumnMappings)) {
      if (combineConfig.type === 'combined') {
        const combinedValue = this.combineCellValues(csvRow, combineConfig);
        if (combinedValue !== null && combinedValue !== undefined && combinedValue !== '') {
          mappedRow[combineConfig.targetField] = combinedValue;
        }
      }
    }
    
    // Apply default values for missing required fields
    for (const [fieldName, config] of Object.entries(this.fieldMappings)) {
      if (!(fieldName in mappedRow) && config.defaultValue !== undefined) {
        mappedRow[fieldName] = config.defaultValue;
      }
    }
    
    // Generate unique ID
    mappedRow.id = this.generateUniqueId();
    
    return mappedRow;
  }

  // Combine values from multiple columns
  combineCellValues(csvRow, combineConfig) {
    const { sourceColumns, combineFunction } = combineConfig;
    
    if (combineFunction === 'quarterMonth') {
      return this.combineQuarterMonth(csvRow, sourceColumns);
    }
    
    // Default: just concatenate with space
    return sourceColumns
      .map(col => csvRow[col] || '')
      .filter(val => val.trim() !== '')
      .join(' ');
  }

  // Combine quarter and month into a single value
  combineQuarterMonth(csvRow, sourceColumns) {
    const values = sourceColumns.map(col => (csvRow[col] || '').toString().trim());
    
    // Find quarter and month values
    let quarter = '';
    let month = '';
    
    for (const value of values) {
      const normalizedValue = value.toLowerCase();
      
      // Check if it looks like a quarter (Q1, Q2, etc.)
      if (normalizedValue.match(/^q[1-4]$/i)) {
        quarter = value.toUpperCase();
      }
      // Check if it looks like a month
      else if (this.isMonth(normalizedValue)) {
        month = this.normalizeMonth(normalizedValue);
      }
    }
    
    // Combine quarter and month
    if (quarter && month) {
      return `${quarter} ${month}`;
    } else if (quarter) {
      return quarter;
    } else if (month) {
      // Try to infer quarter from month
      const inferredQuarter = this.inferQuarterFromMonth(month);
      return inferredQuarter ? `${inferredQuarter} ${month}` : month;
    }
    
    // Fallback: use first non-empty value
    return values.find(val => val !== '') || 'Q1';
  }

  // Check if a value looks like a month
  isMonth(value) {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];
    return months.includes(value.toLowerCase());
  }

  // Normalize month name to standard format
  normalizeMonth(month) {
    const monthMap = {
      'january': 'January', 'jan': 'January',
      'february': 'February', 'feb': 'February', 
      'march': 'March', 'mar': 'March',
      'april': 'April', 'apr': 'April',
      'may': 'May',
      'june': 'June', 'jun': 'June',
      'july': 'July', 'jul': 'July',
      'august': 'August', 'aug': 'August',
      'september': 'September', 'sep': 'September',
      'october': 'October', 'oct': 'October',
      'november': 'November', 'nov': 'November',
      'december': 'December', 'dec': 'December'
    };
    return monthMap[month.toLowerCase()] || month;
  }

  // Infer quarter from month
  inferQuarterFromMonth(month) {
    const normalizedMonth = month.toLowerCase();
    if (['january', 'jan', 'february', 'feb', 'march', 'mar'].includes(normalizedMonth)) {
      return 'Q1';
    } else if (['april', 'apr', 'may', 'june', 'jun'].includes(normalizedMonth)) {
      return 'Q2';
    } else if (['july', 'jul', 'august', 'aug', 'september', 'sep'].includes(normalizedMonth)) {
      return 'Q3';
    } else if (['october', 'oct', 'november', 'nov', 'december', 'dec'].includes(normalizedMonth)) {
      return 'Q4';
    }
    return null;
  }

  // Clean and convert values based on field type
  cleanValue(value, fieldConfig) {
    if (value === null || value === undefined || value === '') {
      return fieldConfig.defaultValue;
    }
    
    // Convert to string first for processing
    let cleanValue = String(value).trim();
    
    if (fieldConfig.isNumeric) {
      // Remove formatting and convert to number
      cleanValue = cleanValue.replace(/[",\s$€£¥]/g, ''); // Remove currency symbols, commas, quotes, spaces
      
      // Handle percentage values
      const isPercentage = cleanValue.endsWith('%');
      if (isPercentage) {
        cleanValue = cleanValue.slice(0, -1); // Remove % symbol
      }
      
      let numValue;
      if (fieldConfig.allowDecimals) {
        // Parse as decimal/double
        numValue = parseFloat(cleanValue);
      } else {
        // Parse as integer
        numValue = parseInt(cleanValue, 10);
      }
      
      // Handle percentage conversion
      if (isPercentage && !isNaN(numValue)) {
        numValue = numValue / 100; // Convert percentage to decimal
      }
      
      return isNaN(numValue) ? fieldConfig.defaultValue : numValue;
    }
    
    if (fieldConfig.isBoolean) {
      // Convert to boolean
      const lowerValue = cleanValue.toLowerCase();
      if (['true', '1', 'yes', 'y', 'on', 'enabled'].includes(lowerValue)) {
        return true;
      } else if (['false', '0', 'no', 'n', 'off', 'disabled'].includes(lowerValue)) {
        return false;
      }
      return fieldConfig.defaultValue;
    }
    
    return cleanValue;
  }

  // Generate unique ID for new rows
  generateUniqueId() {
    return 'imp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Show mapping preview to user before import
  showMappingPreview(csvHeaders, analysisResult) {
    const { mapping, confidence, unmappedHeaders, combinedColumnMappings, summary } = analysisResult;
    
    let previewHTML = `
      <div style="max-width: 600px; padding: 20px; font-family: system-ui;">
        <h3 style="color: #333; margin-bottom: 15px;">📋 CSV Import Preview</h3>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #495057;">Import Summary</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
            <div><strong>Total columns:</strong> ${summary.totalHeaders}</div>
            <div><strong>Mapped columns:</strong> ${summary.mappedHeaders}</div>
            <div><strong>Unmapped columns:</strong> ${summary.unmappedHeaders}</div>
            <div><strong>Confidence:</strong> ${(summary.averageConfidence * 100).toFixed(1)}%</div>
          </div>
        </div>
        
        <h4 style="color: #333; margin-bottom: 10px;">Column Mappings</h4>
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 6px;">
    `;
    
    // Show combined column mappings first
    for (const [combinedKey, combineConfig] of Object.entries(combinedColumnMappings)) {
      if (combineConfig.type === 'combined') {
        const sourceColsText = combineConfig.sourceColumns.join(' + ');
        previewHTML += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #e9ecef; background: #e3f2fd;">
            <div style="flex: 1;">
              <strong style="color: #1976d2;">🔗 ${sourceColsText}</strong>
              <span style="color: #6c757d;"> → </span>
              <span style="color: #007bff;">${combineConfig.targetField}</span>
              <div style="font-size: 12px; color: #6c757d; margin-top: 2px;">Combined column mapping</div>
            </div>
            <div style="background: #2196f3; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
              Smart
            </div>
          </div>
        `;
      }
    }
    
    // Show successful simple mappings
    for (const [csvHeader, fieldName] of Object.entries(mapping)) {
      // Skip combined mappings (they're shown above)
      if (typeof fieldName === 'string' && !csvHeader.includes('+')) {
        const conf = confidence[csvHeader] || 1.0;
        const confColor = conf >= 0.9 ? '#28a745' : conf >= 0.7 ? '#ffc107' : '#fd7e14';
        const confText = conf >= 0.9 ? 'Excellent' : conf >= 0.7 ? 'Good' : 'Fair';
        
        previewHTML += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #e9ecef;">
            <div style="flex: 1;">
              <strong style="color: #495057;">${csvHeader}</strong>
              <span style="color: #6c757d;"> → </span>
              <span style="color: #007bff;">${fieldName}</span>
            </div>
            <div style="background: ${confColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
              ${confText}
            </div>
          </div>
        `;
      }
    }
    
    // Show unmapped headers
    if (unmappedHeaders.length > 0) {
      previewHTML += `
        <div style="padding: 8px 12px; background: #fff3cd; border-bottom: 1px solid #e9ecef;">
          <strong style="color: #856404;">Unmapped columns:</strong>
          <div style="margin-top: 5px; font-size: 14px; color: #856404;">
            ${unmappedHeaders.join(', ')}
          </div>
          <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
            These columns will be ignored during import
          </div>
        </div>
      `;
    }
    
    previewHTML += `
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <button id="confirmImport" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px;">
            ✅ Import with these mappings
          </button>
          <button id="cancelImport" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
            ❌ Cancel
          </button>
        </div>
      </div>
    `;
    
    return previewHTML;
  }
}

// Export for use in planning.js
window.SmartCSVMapper = SmartCSVMapper;
