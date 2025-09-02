/**
 * Analytics Engine - Core Analytics and Predictive Modeling
 * Phase 3.1: Advanced Analytics & Insights Foundation
 * 
 * Provides predictive analytics, trend analysis, and performance insights
 * for campaign and budget optimization
 */

import eventBus, { EVENTS } from '../utils/EventBus.js';

export class AnalyticsEngine {
  constructor(options = {}) {
    this.config = {
      enablePredictions: true,
      enableTrendAnalysis: true,
      enableAnomalyDetection: true,
      enableRecommendations: true,
      confidenceThreshold: 0.7,
      maxPredictionDays: 90,
      trendPeriodDays: 30,
      anomalyThreshold: 2.0, // Standard deviations
      ...options
    };
    
    this.models = new Map();
    this.cache = new Map();
    this.insights = new Map();
    this.predictions = new Map();
    this.trends = new Map();
    this.anomalies = new Map();
    
    this.initialized = false;
    this.lastAnalysis = null;
    
    console.log('🧠 Analytics Engine initialized');
  }
  
  /**
   * Initialize the analytics engine with data
   * @param {Array} planningData - Historical planning data
   * @param {Array} executionData - Historical execution data
   * @param {Array} budgetData - Budget information
   */
  async initialize(planningData = [], executionData = [], budgetData = []) {
    try {
      console.log('🔧 Initializing analytics engine with data...');
      
      // Store data for analysis
      this.planningData = planningData;
      this.executionData = executionData;
      this.budgetData = budgetData;
      
      // Build analytical models
      await this.buildModels();
      
      // Perform initial analysis
      await this.performInitialAnalysis();
      
      this.initialized = true;
      this.lastAnalysis = new Date();
      
      eventBus.publish(EVENTS.ANALYTICS_READY, {
        source: 'analytics_engine',
        planningRecords: planningData.length,
        executionRecords: executionData.length,
        budgetRecords: budgetData.length
      });
      
      console.log('✅ Analytics engine initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize analytics engine:', error);
      throw error;
    }
  }
  
  /**
   * Build predictive and analytical models
   */
  async buildModels() {
    console.log('🔨 Building analytical models...');
    
    // Campaign Performance Prediction Model
    this.models.set('campaign_performance', {
      type: 'regression',
      features: ['budget', 'region', 'quarter', 'programType', 'historicalPerformance'],
      target: 'expectedROI',
      accuracy: 0,
      lastTrained: new Date()
    });
    
    // Budget Optimization Model
    this.models.set('budget_optimization', {
      type: 'optimization',
      features: ['region', 'quarter', 'programType', 'historicalSpend', 'marketConditions'],
      target: 'optimalBudgetAllocation',
      accuracy: 0,
      lastTrained: new Date()
    });
    
    // Campaign Success Classification Model
    this.models.set('campaign_success', {
      type: 'classification',
      features: ['budget', 'duration', 'region', 'programType', 'teamSize'],
      target: 'successProbability',
      accuracy: 0,
      lastTrained: new Date()
    });
    
    // Trend Analysis Model
    this.models.set('trend_analysis', {
      type: 'time_series',
      features: ['date', 'spend', 'leads', 'conversions', 'seasonality'],
      target: 'futureTrend',
      accuracy: 0,
      lastTrained: new Date()
    });
    
    console.log(`✅ Built ${this.models.size} analytical models`);
  }
  
  /**
   * Perform initial comprehensive analysis
   */
  async performInitialAnalysis() {
    console.log('📊 Performing initial analysis...');
    
    const startTime = performance.now();
    
    // Run all analysis types in parallel
    const [
      performanceAnalysis,
      trendAnalysis,
      budgetAnalysis,
      anomalyAnalysis
    ] = await Promise.allSettled([
      this.analyzeCampaignPerformance(),
      this.analyzeTrends(),
      this.analyzeBudgetEfficiency(),
      this.detectAnomalies()
    ]);
    
    // Generate insights based on analysis
    await this.generateInsights();
    
    // Create recommendations
    await this.generateRecommendations();
    
    const duration = performance.now() - startTime;
    console.log(`✅ Initial analysis completed in ${duration.toFixed(2)}ms`);
    
    eventBus.publish(EVENTS.ANALYTICS_COMPLETE, {
      source: 'analytics_engine',
      duration,
      analysisTypes: ['performance', 'trends', 'budget', 'anomalies'],
      insightCount: this.insights.size,
      predictionCount: this.predictions.size
    });
  }
  
  /**
   * Analyze campaign performance and predict outcomes
   */
  async analyzeCampaignPerformance() {
    console.log('🎯 Analyzing campaign performance...');
    
    const campaigns = [...this.planningData, ...this.executionData];
    const performanceScores = new Map();
    const predictions = new Map();
    
    for (const campaign of campaigns) {
      try {
        // Calculate performance score
        const score = this.calculatePerformanceScore(campaign);
        performanceScores.set(campaign.id, score);
        
        // Predict future performance
        const prediction = this.predictCampaignOutcome(campaign);
        predictions.set(campaign.id, prediction);
        
      } catch (error) {
        console.warn(`Warning: Could not analyze campaign ${campaign.id}:`, error);
      }
    }
    
    this.cache.set('performance_scores', performanceScores);
    this.predictions.set('campaign_outcomes', predictions);
    
    console.log(`📈 Analyzed ${campaigns.length} campaigns for performance`);
    return { performanceScores, predictions };
  }
  
  /**
   * Calculate performance score for a campaign
   * @param {Object} campaign - Campaign data
   * @returns {Object} Performance score and metrics
   */
  calculatePerformanceScore(campaign) {
    const metrics = {
      budgetEfficiency: 0,
      leadGeneration: 0,
      conversion: 0,
      roi: 0,
      timeline: 0
    };
    
    // Budget efficiency (actual vs forecasted cost)
    if (campaign.forecastedCost && campaign.actualCost) {
      const variance = Math.abs(campaign.actualCost - campaign.forecastedCost) / campaign.forecastedCost;
      metrics.budgetEfficiency = Math.max(0, 100 - (variance * 100));
    }
    
    // Lead generation efficiency
    if (campaign.expectedLeads && campaign.actualLeads) {
      const leadEfficiency = Math.min(100, (campaign.actualLeads / campaign.expectedLeads) * 100);
      metrics.leadGeneration = leadEfficiency;
    }
    
    // Conversion efficiency
    if (campaign.actualLeads && campaign.actualMQLs) {
      const conversionRate = (campaign.actualMQLs / campaign.actualLeads) * 100;
      metrics.conversion = Math.min(100, conversionRate);
    }
    
    // ROI calculation
    if (campaign.actualCost && campaign.actualPipeline) {
      const roi = ((campaign.actualPipeline - campaign.actualCost) / campaign.actualCost) * 100;
      metrics.roi = Math.max(0, Math.min(100, roi / 5)); // Scale to 0-100
    }
    
    // Timeline adherence
    if (campaign.status) {
      metrics.timeline = campaign.status === 'Complete' ? 100 : 
                        campaign.status === 'Active' ? 75 : 50;
    }
    
    // Overall score (weighted average)
    const weights = {
      budgetEfficiency: 0.25,
      leadGeneration: 0.25,
      conversion: 0.20,
      roi: 0.20,
      timeline: 0.10
    };
    
    const overallScore = Object.entries(metrics).reduce((sum, [key, value]) => {
      return sum + (value * weights[key]);
    }, 0);
    
    return {
      overall: Math.round(overallScore),
      metrics,
      grade: this.getPerformanceGrade(overallScore),
      recommendations: this.getPerformanceRecommendations(metrics)
    };
  }
  
  /**
   * Predict campaign outcome based on historical data
   * @param {Object} campaign - Campaign data
   * @returns {Object} Prediction results
   */
  predictCampaignOutcome(campaign) {
    const features = this.extractFeatures(campaign);
    const similarCampaigns = this.findSimilarCampaigns(campaign);
    
    // Simple prediction based on similar campaigns
    const avgPerformance = similarCampaigns.reduce((sum, similar) => {
      const score = this.calculatePerformanceScore(similar);
      return sum + score.overall;
    }, 0) / Math.max(1, similarCampaigns.length);
    
    // Adjust based on campaign-specific factors
    let adjustmentFactor = 1.0;
    
    // Budget factor
    if (campaign.forecastedCost) {
      const avgBudget = similarCampaigns.reduce((sum, c) => sum + (c.forecastedCost || 0), 0) / similarCampaigns.length;
      if (avgBudget > 0) {
        adjustmentFactor *= Math.min(1.2, campaign.forecastedCost / avgBudget);
      }
    }
    
    // Regional factor
    const regionalPerformance = this.getRegionalPerformanceMultiplier(campaign.region);
    adjustmentFactor *= regionalPerformance;
    
    const predictedScore = Math.min(100, avgPerformance * adjustmentFactor);
    const confidence = Math.min(1.0, similarCampaigns.length / 10); // More similar campaigns = higher confidence
    
    return {
      predictedScore: Math.round(predictedScore),
      confidence: Math.round(confidence * 100),
      basedOnCampaigns: similarCampaigns.length,
      factors: {
        budgetFactor: adjustmentFactor,
        regionalFactor: regionalPerformance,
        similarCampaigns: similarCampaigns.length
      },
      recommendations: this.getPredictiveRecommendations(predictedScore, features)
    };
  }
  
  /**
   * Analyze trends in campaign data
   */
  async analyzeTrends() {
    console.log('📈 Analyzing trends...');
    
    const trends = {
      budget: this.analyzeBudgetTrends(),
      performance: this.analyzePerformanceTrends(),
      regional: this.analyzeRegionalTrends(),
      temporal: this.analyzeTemporalTrends(),
      programType: this.analyzeProgramTypeTrends()
    };
    
    this.trends.set('overall', trends);
    
    console.log('✅ Trend analysis completed');
    return trends;
  }
  
  /**
   * Analyze budget trends over time
   */
  analyzeBudgetTrends() {
    const budgetData = this.planningData
      .filter(campaign => campaign.forecastedCost && campaign.quarter)
      .sort((a, b) => this.compareQuarters(a.quarter, b.quarter));
    
    if (budgetData.length < 2) return { trend: 'insufficient_data', change: 0 };
    
    const quarterlySpend = budgetData.reduce((acc, campaign) => {
      const quarter = campaign.quarter;
      if (!acc[quarter]) acc[quarter] = 0;
      acc[quarter] += campaign.forecastedCost;
      return acc;
    }, {});
    
    const quarters = Object.keys(quarterlySpend).sort(this.compareQuarters);
    const values = quarters.map(q => quarterlySpend[q]);
    
    // Calculate trend using linear regression
    const trend = this.calculateLinearTrend(values);
    
    return {
      trend: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable',
      change: Math.round(trend.slope),
      confidence: trend.confidence,
      quarters: quarters.length,
      totalSpend: values.reduce((sum, v) => sum + v, 0),
      avgQuarterlySpend: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
    };
  }
  
  /**
   * Detect anomalies in campaign data
   */
  async detectAnomalies() {
    console.log('🔍 Detecting anomalies...');
    
    const anomalies = [];
    const campaigns = [...this.planningData, ...this.executionData];
    
    // Budget anomalies
    const budgetAnomalies = this.detectBudgetAnomalies(campaigns);
    anomalies.push(...budgetAnomalies);
    
    // Performance anomalies
    const performanceAnomalies = this.detectPerformanceAnomalies(campaigns);
    anomalies.push(...performanceAnomalies);
    
    // Timeline anomalies
    const timelineAnomalies = this.detectTimelineAnomalies(campaigns);
    anomalies.push(...timelineAnomalies);
    
    this.anomalies.set('detected', anomalies);
    
    console.log(`🚨 Detected ${anomalies.length} anomalies`);
    return anomalies;
  }
  
  /**
   * Generate insights based on analysis
   */
  async generateInsights() {
    console.log('💡 Generating insights...');
    
    const insights = [];
    
    // Performance insights
    const performanceScores = this.cache.get('performance_scores');
    if (performanceScores) {
      const avgScore = Array.from(performanceScores.values()).reduce((sum, score) => sum + score.overall, 0) / performanceScores.size;
      
      insights.push({
        type: 'performance',
        title: 'Overall Campaign Performance',
        description: `Average campaign performance score is ${Math.round(avgScore)}/100`,
        score: avgScore,
        priority: avgScore < 60 ? 'high' : avgScore < 80 ? 'medium' : 'low',
        actionable: avgScore < 80
      });
    }
    
    // Budget insights
    const budgetTrends = this.trends.get('overall')?.budget;
    if (budgetTrends) {
      insights.push({
        type: 'budget',
        title: 'Budget Trend Analysis',
        description: `Budget spending is ${budgetTrends.trend} with ${budgetTrends.change}% change`,
        trend: budgetTrends.trend,
        priority: Math.abs(budgetTrends.change) > 20 ? 'high' : 'medium',
        actionable: true
      });
    }
    
    // Anomaly insights
    const anomalies = this.anomalies.get('detected') || [];
    if (anomalies.length > 0) {
      insights.push({
        type: 'anomaly',
        title: 'Data Anomalies Detected',
        description: `Found ${anomalies.length} unusual patterns in campaign data`,
        count: anomalies.length,
        priority: anomalies.length > 5 ? 'high' : 'medium',
        actionable: true
      });
    }
    
    this.insights.set('generated', insights);
    
    console.log(`✨ Generated ${insights.length} insights`);
    return insights;
  }
  
  /**
   * Generate actionable recommendations
   */
  async generateRecommendations() {
    console.log('🎯 Generating recommendations...');
    
    const recommendations = [];
    const insights = this.insights.get('generated') || [];
    
    // Performance-based recommendations
    const performanceInsight = insights.find(i => i.type === 'performance');
    if (performanceInsight && performanceInsight.score < 80) {
      recommendations.push({
        type: 'performance_improvement',
        title: 'Improve Campaign Performance',
        description: 'Focus on budget efficiency and lead conversion optimization',
        impact: 'high',
        effort: 'medium',
        actions: [
          'Review underperforming campaigns',
          'Optimize budget allocation',
          'Improve lead generation strategies',
          'Enhance conversion processes'
        ]
      });
    }
    
    // Budget optimization recommendations
    const budgetInsight = insights.find(i => i.type === 'budget');
    if (budgetInsight && Math.abs(budgetInsight.change || 0) > 15) {
      recommendations.push({
        type: 'budget_optimization',
        title: 'Optimize Budget Allocation',
        description: 'Significant budget changes detected - review allocation strategy',
        impact: 'high',
        effort: 'low',
        actions: [
          'Analyze budget variance by region',
          'Review high-spending campaigns',
          'Implement budget controls',
          'Consider reallocation opportunities'
        ]
      });
    }
    
    this.cache.set('recommendations', recommendations);
    
    console.log(`🎯 Generated ${recommendations.length} recommendations`);
    return recommendations;
  }
  
  /**
   * Get analytics summary for dashboard
   */
  getAnalyticsSummary() {
    const insights = this.insights.get('generated') || [];
    const recommendations = this.cache.get('recommendations') || [];
    const anomalies = this.anomalies.get('detected') || [];
    const performanceScores = this.cache.get('performance_scores') || new Map();
    
    const avgPerformance = Array.from(performanceScores.values())
      .reduce((sum, score) => sum + score.overall, 0) / Math.max(1, performanceScores.size);
    
    return {
      summary: {
        campaignsAnalyzed: this.planningData.length + this.executionData.length,
        averagePerformance: Math.round(avgPerformance),
        insightsGenerated: insights.length,
        recommendationsAvailable: recommendations.length,
        anomaliesDetected: anomalies.length,
        lastAnalysis: this.lastAnalysis
      },
      insights: insights.slice(0, 5), // Top 5 insights
      recommendations: recommendations.slice(0, 3), // Top 3 recommendations
      topAnomalies: anomalies.slice(0, 3) // Top 3 anomalies
    };
  }
  
  /**
   * Helper methods
   */
  extractFeatures(campaign) {
    return {
      budget: campaign.forecastedCost || 0,
      region: campaign.region || 'unknown',
      quarter: campaign.quarter || 'unknown',
      programType: campaign.programType || 'unknown',
      duration: this.calculateCampaignDuration(campaign),
      teamSize: this.estimateTeamSize(campaign)
    };
  }
  
  findSimilarCampaigns(campaign, limit = 10) {
    const allCampaigns = [...this.planningData, ...this.executionData];
    const features = this.extractFeatures(campaign);
    
    return allCampaigns
      .filter(c => c.id !== campaign.id)
      .map(c => ({
        campaign: c,
        similarity: this.calculateSimilarity(features, this.extractFeatures(c))
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.campaign);
  }
  
  calculateSimilarity(features1, features2) {
    let similarity = 0;
    let factors = 0;
    
    // Region similarity
    if (features1.region === features2.region) similarity += 0.3;
    factors++;
    
    // Program type similarity
    if (features1.programType === features2.programType) similarity += 0.3;
    factors++;
    
    // Budget similarity (within 50%)
    if (features1.budget && features2.budget) {
      const budgetRatio = Math.min(features1.budget, features2.budget) / Math.max(features1.budget, features2.budget);
      similarity += budgetRatio * 0.4;
    }
    factors++;
    
    return similarity / factors;
  }
  
  getPerformanceGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }
  
  getPerformanceRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.budgetEfficiency < 70) {
      recommendations.push('Improve budget planning and control');
    }
    if (metrics.leadGeneration < 70) {
      recommendations.push('Optimize lead generation strategies');
    }
    if (metrics.conversion < 70) {
      recommendations.push('Enhance lead conversion processes');
    }
    if (metrics.roi < 70) {
      recommendations.push('Focus on higher ROI activities');
    }
    
    return recommendations;
  }
  
  getPredictiveRecommendations(predictedScore, features) {
    const recommendations = [];
    
    if (predictedScore < 70) {
      recommendations.push('Consider revising campaign strategy');
      if (features.budget > 100000) {
        recommendations.push('High budget campaign - ensure strong ROI focus');
      }
    }
    
    return recommendations;
  }
  
  getRegionalPerformanceMultiplier(region) {
    // This could be based on historical data
    const regionMultipliers = {
      'North America': 1.1,
      'Europe': 1.0,
      'Asia Pacific': 0.95,
      'LATAM': 0.9
    };
    
    return regionMultipliers[region] || 1.0;
  }
  
  compareQuarters(q1, q2) {
    // Simple quarter comparison - this could be enhanced
    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarterOrder.indexOf(q1) - quarterOrder.indexOf(q2);
  }
  
  calculateLinearTrend(values) {
    if (values.length < 2) return { slope: 0, confidence: 0 };
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const confidence = Math.min(1.0, n / 10); // Simple confidence based on data points
    
    return { slope, confidence };
  }
  
  detectBudgetAnomalies(campaigns) {
    const budgets = campaigns
      .map(c => c.forecastedCost)
      .filter(b => b && b > 0);
    
    if (budgets.length < 3) return [];
    
    const mean = budgets.reduce((sum, b) => sum + b, 0) / budgets.length;
    const stdDev = Math.sqrt(budgets.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / budgets.length);
    
    return campaigns
      .filter(c => c.forecastedCost && Math.abs(c.forecastedCost - mean) > this.config.anomalyThreshold * stdDev)
      .map(c => ({
        type: 'budget',
        campaign: c,
        description: `Budget ${c.forecastedCost > mean ? 'significantly higher' : 'significantly lower'} than average`,
        severity: Math.abs(c.forecastedCost - mean) / stdDev > 3 ? 'high' : 'medium'
      }));
  }
  
  detectPerformanceAnomalies(campaigns) {
    // This would detect campaigns with unusual performance patterns
    return [];
  }
  
  detectTimelineAnomalies(campaigns) {
    // This would detect campaigns with unusual timeline patterns
    return [];
  }
  
  calculateCampaignDuration(campaign) {
    // Simple duration estimation - could be enhanced with actual dates
    return 30; // Default 30 days
  }
  
  estimateTeamSize(campaign) {
    // Simple team size estimation based on budget and program type
    const budget = campaign.forecastedCost || 0;
    if (budget > 500000) return 'large';
    if (budget > 100000) return 'medium';
    return 'small';
  }
  
  analyzePerformanceTrends() {
    return { trend: 'stable', change: 0 };
  }
  
  analyzeRegionalTrends() {
    return { trend: 'stable', change: 0 };
  }
  
  analyzeTemporalTrends() {
    return { trend: 'stable', change: 0 };
  }
  
  analyzeProgramTypeTrends() {
    return { trend: 'stable', change: 0 };
  }
}

export default AnalyticsEngine;
