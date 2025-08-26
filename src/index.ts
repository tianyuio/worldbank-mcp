#!/usr/bin/env node

import { program } from 'commander';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import axios from 'axios';
import { Country, Indicator, DataPoint, WorldBankResponse, QueryParams } from './types.js';

const VERSION = '1.0.0';
const API_BASE = 'https://api.worldbank.org/v2';

// Common indicator IDs
const COMMON_INDICATORS = {
  // Economic indicators
  GDP: 'NY.GDP.MKTP.CD', // GDP (current US$)
  GDP_GROWTH: 'NY.GDP.MKTP.KD.ZG', // GDP growth (annual %)
  GDP_PER_CAPITA: 'NY.GDP.PCAP.CD', // GDP per capita (current US$)
  GNI: 'NY.GNP.MKTP.CD', // GNI (current US$)
  GNI_PER_CAPITA: 'NY.GNP.PCAP.CD', // GNI per capita (current US$)
  EXPORTS_GDP: 'NE.EXP.GNFS.ZS', // Exports of goods and services (% of GDP)
  FDI_NET: 'BN.KLT.DINV.CD', // Foreign direct investment, net inflows (current US$)
  INFLATION: 'FP.CPI.TOTL.ZG', // Inflation, consumer prices (annual %)
  UNEMPLOYMENT: 'SL.UEM.TOTL.ZS', // Unemployment, total (% of total labor force)
  
  // Social development indicators
  POPULATION: 'SP.POP.TOTL', // Population, total
  LIFE_EXPECTANCY: 'SP.DYN.LE00.IN', // Life expectancy at birth, total (years)
  BIRTH_RATE: 'SP.DYN.CBRT.IN', // Birth rate, crude (per 1,000 people)
  DEATH_RATE: 'SP.DYN.CDRT.IN', // Death rate, crude (per 1,000 people)
  INTERNET_USERS: 'IT.NET.USER.ZS', // Individuals using the Internet (% of population)
  
  // Education indicators
  LITERACY_RATE: 'SE.ADT.LITR.ZS', // Literacy rate, adult total (% of people ages 15 and above)
  SCHOOL_ENROLLMENT: 'SE.PRM.ENRR', // School enrollment, primary (% gross)
  SCHOOL_COMPLETION: 'SE.PRM.CMPT.ZS', // Primary completion rate, total (% of relevant age group)
  TEACHERS_PRIMARY: 'SE.PRM.TCHR', // Teachers in primary education
  EDUCATION_EXPENDITURE: 'SE.XPD.TOTL.GD.ZS', // Government expenditure on education, total (% of GDP),
  
  // Health and nutrition indicators
  HEALTH_EXPENDITURE: 'SH.XPD.CHEX.GD.ZS', // Current health expenditure (% of GDP)
  PHYSICIANS: 'SH.MED.PHYS.ZS', // Physicians (per 1,000 people)
  HOSPITAL_BEDS: 'SH.MED.BEDS.ZS', // Hospital beds (per 1,000 people)
  IMMUNIZATION: 'SH.IMM.MEAS', // Immunization, measles (% of children ages 12-23 months)
  HIV_PREVALENCE: 'SH.DYN.AIDS.ZS', // Prevalence of HIV, total (% of population ages 15-49)
  MALNUTRITION: 'SH.STA.MALN.ZS', // Prevalence of undernourishment (% of population)
  TUBERCULOSIS: 'SH.TBS.INCD', // Incidence of tuberculosis (per 100,000 people)
};

// Cache for frequently used country data
let COUNTRIES_CACHE: Country[] = [];
let INDICATORS_CACHE: Indicator[] = [];

// World Bank API request function with enhanced error handling
async function makeWorldBankRequest<T>(
  endpoint: string,
  params: QueryParams = {}
): Promise<WorldBankResponse<T> | null> {
  try {
    const defaultParams: QueryParams = {
      format: 'json',
      per_page: 50,
      ...params
    };

    const queryString = new URLSearchParams();
    Object.entries(defaultParams).forEach(([key, value]) => {
      if (value !== undefined) {
        queryString.append(key, value.toString());
      }
    });

    const url = `${API_BASE}/${endpoint}?${queryString}`;
    const response = await axios.get(url, {
      timeout: 10000, // 10 seconds timeout
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });

    // Handle different response formats from World Bank API
    if (Array.isArray(response.data)) {
      if (response.data.length === 0) {
        console.warn(`World Bank API returned empty array for endpoint: ${endpoint}`);
        return null;
      }
      
      // Check for error responses (World Bank API sometimes returns error messages in array format)
      const firstItem = response.data[0];
      if (firstItem && firstItem.message) {
        console.error(`World Bank API error: ${firstItem.message}`, { endpoint, params });
        return null;
      }
      
      return response.data as unknown as WorldBankResponse<T>;
    }
    
    // Handle single object responses
    return response.data;

  } catch (error: any) {
    // Enhanced error classification and logging
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error('World Bank API request timeout:', error.message);
      } else if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          console.error('World Bank API endpoint not found:', endpoint);
        } else if (status === 429) {
          console.error('World Bank API rate limit exceeded - please try again later');
        } else if (status >= 500) {
          console.error('World Bank API server error:', status, data);
        } else {
          console.error('World Bank API client error:', status, data);
        }
      } else if (error.request) {
        // Network error
        console.error('World Bank API network error:', error.message);
      } else {
        // Other axios error
        console.error('World Bank API request setup error:', error.message);
      }
    } else {
      // Non-axios error
      console.error('Unexpected error in World Bank API request:', error);
    }
    
    return null;
  }
}

// Enhanced function to get complete paginated data
async function getCompleteList<T>(
  endpoint: string,
  params: QueryParams = {},
  maxPages: number = 20, // Safety limit to avoid excessive requests
  perPage: number = 100 // Reasonable page size
): Promise<T[]> {
  let allData: T[] = [];
  let currentPage = 1;
  
  try {
    while (currentPage <= maxPages) {
      const response = await makeWorldBankRequest<T>(endpoint, {
        ...params,
        page: currentPage,
        per_page: perPage
      });
      
      if (!response || !Array.isArray(response) || response.length < 2) {
        break;
      }
      
      const pageData = response[1] as T[];
      allData = allData.concat(pageData);
      
      // Extract pagination info from first array item
      const paginationInfo = response[0] as any;
      if (currentPage >= paginationInfo.pages) {
        break;
      }
      
      currentPage++;
      
      // Add small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error(`Error fetching complete ${endpoint} list:`, error);
  }
  
  return allData;
}

// Get countries list with pagination
async function getCountries(): Promise<Country[]> {
  if (COUNTRIES_CACHE.length > 0) {
    return COUNTRIES_CACHE;
  }

  const allCountries = await getCompleteList<Country>('countries', {}, 5, 100);
  
  if (allCountries.length > 0) {
    COUNTRIES_CACHE = allCountries.filter((country: Country) => 
      country.region.value !== 'Aggregates' && country.id.length === 3
    );
    return COUNTRIES_CACHE;
  }

  return [];
}

// Get indicators list with pagination
async function getIndicators(): Promise<Indicator[]> {
  if (INDICATORS_CACHE.length > 0) {
    return INDICATORS_CACHE;
  }

  // For indicators, we get more pages to have a comprehensive list
  const allIndicators = await getCompleteList<Indicator>('indicators', {}, 10, 50);
  
  if (allIndicators.length > 0) {
    INDICATORS_CACHE = allIndicators;
    return INDICATORS_CACHE;
  }

  return [];
}

// Get country data
async function getCountryData(countryCode: string, indicatorId: string, years: number = 10): Promise<DataPoint[]> {
  const response = await makeWorldBankRequest<DataPoint>(
    `country/${countryCode}/indicator/${indicatorId}`,
    { per_page: years }
  );

  if (response && Array.isArray(response[1])) {
    return response[1].filter((point: DataPoint) => point.value !== null);
  }

  return [];
}

// Format country information
function formatCountryInfo(country: Country): string {
  return `
  Country: ${country.name} (${country.iso2Code})
  Region: ${country.region.value}
  Income Level: ${country.incomeLevel.value}
  Capital: ${country.capitalCity}
  Coordinates: ${country.latitude}, ${country.longitude}
  `.trim();
}

// Format indicator data
function formatIndicatorData(data: DataPoint[], indicatorName: string): string {
  if (data.length === 0) {
    return `No data found for ${indicatorName}`;
  }

  let result = `${indicatorName} data:\\\\n`;
  result += 'Year | Value | Unit\\\\n';
  result += '--- | --- | ---\\\\n';

  data.forEach(point => {
    result += `${point.date} | ${point.value?.toLocaleString() || 'N/A'} | ${point.unit || 'N/A'}\\\\n`;
  });

  return result;
}

// Handle indicator data request (common logic for all data tools)
async function handleIndicatorData(
  countryCode: string, 
  indicatorKey: string, 
  years: number
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const indicatorId = COMMON_INDICATORS[indicatorKey as keyof typeof COMMON_INDICATORS];
  if (!indicatorId) {
    return {
      content: [{
        type: 'text',
        text: 'Error: Unsupported indicator type'
      }],
    };
  }

  const countries = await getCountries();
  const country = countries.find(c => 
    c.iso2Code === countryCode.toUpperCase() || c.id === countryCode.toUpperCase()
  );

  if (!country) {
    return {
      content: [{
        type: 'text',
        text: 'Error: Country not found'
      }],
    };
  }

  const data = await getCountryData(country.id, indicatorId, years);
  const indicatorName = Object.entries(COMMON_INDICATORS)
    .find(([key, id]) => id === indicatorId)?.[0] || indicatorKey;

  return {
    content: [{
      type: 'text',
      text: formatIndicatorData(data, `${country.name} - ${indicatorName}`)
    }],
  };
}

// Create MCP server
export const server = new McpServer({
  name: 'worldbank-mcp',
  version: VERSION,
  capabilities: {
    resources: {},
    tools: {},
  },
  instructions: 'World Bank Open Data MCP service providing global economic and social development data query functionality.'
});

// Get countries list tool
server.tool(
  'get-countries',
  'Get all countries supported by World Bank',
  {
    region: z.string().optional().describe('Filter by region, e.g.: "East Asia & Pacific"'),
    incomeLevel: z.string().optional().describe('Filter by income level, e.g.: "High income"')
  },
  async ({ region, incomeLevel }) => {
    const countries = await getCountries();
    
    let filteredCountries = countries;
    if (region && region.trim() !== '') {
      filteredCountries = filteredCountries.filter(c => c.region.value.includes(region));
    }
    if (incomeLevel && incomeLevel.trim() !== '') {
      filteredCountries = filteredCountries.filter(c => c.incomeLevel.value.includes(incomeLevel));
    }

    const result = filteredCountries.map(country => 
      `${country.name} (${country.iso2Code}) - ${country.region.value} - ${country.incomeLevel.value}`
    ).join('\\n');

    return {
      content: [{
        type: 'text',
        text: result || 'No countries found matching the criteria'
      }],
    };
  }
);

// Get country details tool
server.tool(
  'get-country-info',
  'Get detailed information for a specific country',
  {
    countryCode: z.string().describe('Country code, e.g.: CN (China), US (USA)')
  },
  async ({ countryCode }) => {
    const countries = await getCountries();
    const country = countries.find(c => 
      c.iso2Code === countryCode.toUpperCase() || c.id === countryCode.toUpperCase()
    );

    if (!country) {
      return {
        content: [{
          type: 'text',
          text: 'Error: Country not found'
        }],
      };
    }

    return {
      content: [{
        type: 'text',
        text: formatCountryInfo(country)
      }],
    };
  }
);

// Search indicators tool
server.tool(
  'search-indicators',
  'Search for available indicators',
  {
    keyword: z.string().describe('Search keyword, e.g.: "education", "health", "environment"')
  },
  async ({ keyword }) => {
    const indicators = await getIndicators();
    const filteredIndicators = indicators.filter(indicator =>
      indicator.name.toLowerCase().includes(keyword.toLowerCase()) ||
      indicator.id.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 20); // Limit results

    if (filteredIndicators.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No related indicators found'
        }],
      };
    }

    const result = filteredIndicators.map(indicator =>
      `${indicator.id}: ${indicator.name} (${indicator.unit || 'N/A'})`
    ).join('\\n');

    return {
      content: [{
        type: 'text',
        text: result
      }],
    };
  }
);

// Indicator descriptions for each category
const ECONOMIC_INDICATORS_DESC = `Economic indicator, e.g.:
      - "GDP": Gross Domestic Product (NY.GDP.MKTP.CD)
      - "GDP_GROWTH": GDP growth rate (NY.GDP.MKTP.KD.ZG)
      - "GDP_PER_CAPITA": GDP per capita (NY.GDP.PCAP.CD)
      - "GNI": Gross National Income (NY.GNP.MKTP.CD)
      - "GNI_PER_CAPITA": GNI per capita (NY.GNP.PCAP.CD)
      - "EXPORTS_GDP": Exports (% of GDP) (NE.EXP.GNFS.ZS)
      - "FDI_NET": Foreign direct investment, net inflows (BN.KLT.DINV.CD)
      - "INFLATION": Inflation rate (FP.CPI.TOTL.ZG)
      - "UNEMPLOYMENT": Unemployment rate (SL.UEM.TOTL.ZS)`;

const SOCIAL_INDICATORS_DESC = `Social indicator, e.g.:
      - "POPULATION": Total population (SP.POP.TOTL)
      - "LIFE_EXPECTANCY": Life expectancy (SP.DYN.LE00.IN)
      - "BIRTH_RATE": Birth rate (SP.DYN.CBRT.IN)
      - "DEATH_RATE": Death rate (SP.DYN.CDRT.IN)
      - "INTERNET_USERS": Internet users percentage (IT.NET.USER.ZS)`;

const EDUCATION_INDICATORS_DESC = `Education indicator, e.g.:
      - "LITERACY_RATE": Literacy rate (SE.ADT.LITR.ZS)
      - "SCHOOL_ENROLLMENT": School enrollment rate (SE.PRM.ENRR)
      - "SCHOOL_COMPLETION": Primary completion rate (SE.PRM.CMPT.ZS)
      - "TEACHERS_PRIMARY": Teachers in primary education (SE.PRM.TCHR)
      - "EDUCATION_EXPENDITURE": Government expenditure on education (SE.XPD.TOTL.GD.ZS)`;

const HEALTH_INDICATORS_DESC = `Health and nutrition indicator, e.g.:
      - "HEALTH_EXPENDITURE": Health expenditure (SH.XPD.CHEX.GD.ZS)
      - "PHYSICIANS": Physicians per 1,000 people (SH.MED.PHYS.ZS)
      - "HOSPITAL_BEDS": Hospital beds per 1,000 people (SH.MED.BEDS.ZS)
      - "IMMUNIZATION": Measles immunization rate (SH.IMM.MEAS)
      - "HIV_PREVALENCE": HIV prevalence (SH.DYN.AIDS.ZS)
      - "MALNUTRITION": Prevalence of undernourishment (SH.STA.MALN.ZS)
      - "TUBERCULOSIS": Tuberculosis incidence (SH.TBS.INCD)`;

// Common parameter descriptions
const COUNTRY_CODE_DESC = 'Country code, e.g.: CN';
const YEARS_DESC = 'Number of years to query, default 10 years';

// Tool configuration for different indicator categories
const toolConfigs = [
  {
    name: 'get-economic-data',
    description: 'Get economic data for a country',
    indicatorDesc: ECONOMIC_INDICATORS_DESC,
    indicators: ['GDP', 'GDP_GROWTH', 'GDP_PER_CAPITA', 'GNI', 'GNI_PER_CAPITA', 'EXPORTS_GDP', 'FDI_NET', 'INFLATION', 'UNEMPLOYMENT']
  },
  {
    name: 'get-social-data', 
    description: 'Get social development data for a country',
    indicatorDesc: SOCIAL_INDICATORS_DESC,
    indicators: ['POPULATION', 'LIFE_EXPECTANCY', 'BIRTH_RATE', 'DEATH_RATE', 'INTERNET_USERS']
  },
  {
    name: 'get-education-data',
    description: 'Get education data for a country', 
    indicatorDesc: EDUCATION_INDICATORS_DESC,
    indicators: ['LITERACY_RATE', 'SCHOOL_ENROLLMENT', 'SCHOOL_COMPLETION', 'TEACHERS_PRIMARY', 'EDUCATION_EXPENDITURE']
  },
  {
    name: 'get-health-data',
    description: 'Get health and nutrition data for a country',
    indicatorDesc: HEALTH_INDICATORS_DESC,
    indicators: ['HEALTH_EXPENDITURE', 'PHYSICIANS', 'HOSPITAL_BEDS', 'IMMUNIZATION', 'HIV_PREVALENCE', 'MALNUTRITION', 'TUBERCULOSIS']
  }
];

// Dynamically create tool functions for each category
toolConfigs.forEach(config => {
  server.tool(
    config.name,
    config.description,
    {
      countryCode: z.string().describe(COUNTRY_CODE_DESC),
      indicator: z.string().describe(config.indicatorDesc),
      years: z.number().optional().default(10).describe(YEARS_DESC)
    },
    async (params) => handleIndicatorData(params.countryCode, params.indicator, params.years)
  );
});

// Main program
program
  .name('worldbank-mcp')
  .description('World Bank Open Data MCP Server')
  .version(VERSION)
  .action(async () => {
    try {
      // Preload data
      await getCountries();
      await getIndicators();

      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error('World Bank MCP Server running on stdio');
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  });

program.parse();