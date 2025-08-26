# World Bank MCP 🌐

[![npm version](https://img.shields.io/npm/v/worldbank-mcp.svg)](https://www.npmjs.com/package/worldbank-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/tianyuio/worldbank-mcp)](https://github.com/tianyuio/worldbank-mcp/issues)

World Bank Model Context Protocol service based on World Bank Open Data API, which provides query capabilities for global economic and social development data.

## Features

- ✅ Country information query
- ✅ Indicator search (education, health, environment, etc.)
- ✅ Economic data query (GDP, inflation, unemployment, etc.)
- ✅ Social development data query (population, life expectancy, internet usage, etc.)
- ✅ Education data query (literacy rate, school enrollment, etc.)
- ✅ Health and nutrition data query (hospitals, immunization, HIV prevalence, malnutrition, etc.)
- ✅ Real-time World Bank API integration
- ✅ Model Context Protocol compatibility

## Installation and Usage

### Install and build project
```bash
# install via npm
npm install -g worldbank-mcp

# or clone and install
git clone https://github.com/tianyuio/worldbank-mcp.git
cd /your/path/to/worldbank-mcp
npm install -g .
```

### Run service
```bash
# stdio mode
npm start

# or run directly
npx worldbank-mcp
```

## Usage in MCP Clients

To use this service in MCP-compatible clients (such as Claude Desktop, Cursor, Cherry Studio, etc.), you need to configure it as follows:

Configuration example:

If you have installed it globally:

```json
{
  "mcpServers": {
    "worldbank-mcp": {
      "name": "World Bank Data",
      "command": "worldbank-mcp",
      "description": "World Bank Open Data MCP Server"
    }
  }
}
```

Or using npx:

```json
{
  "mcpServers": {
    "worldbank-mcp": {
      "name": "World Bank Data",
      "command": "npx",
      "args": ["worldbank-mcp"],
      "description": "World Bank Open Data MCP Server"
    }
  }
}
```

Else if you have not installed it globally, using node directly:

```json
{
  "mcpServers": {
    "worldbank-mcp": {
      "name": "World Bank Data",
      "command": "node",
      "args": ["path/to/worldbank-mcp/build/index.js"],
      "description": "World Bank Open Data MCP Server"
    }
  }
}
```

Replace `path/to/` with the actual path to your project directory.


## MCP Tools

### 1. Get Countries List
```json
{
  "name": "get-countries",
  "description": "Get all countries supported by World Bank",
  "parameters": {
    "region": "Filter by region (optional)",
    "incomeLevel": "Filter by income level (optional)"
  }
}
```

### 2. Get Country Information
```json
{
  "name": "get-country-info", 
  "description": "Get detailed information for a specific country",
  "parameters": {
    "countryCode": "Country code (e.g.: CN, US)"
  }
}
```

### 3. Search Indicators
```json
{
  "name": "search-indicators",
  "description": "Search for available indicators",
  "parameters": {
    "keyword": "Search keyword"
  }
}
```

### 4. Get Economic Data
```json
{
  "name": "get-economic-data",
  "description": "Get economic data for a country",
  "parameters": {
    "countryCode": "Country code",
    "indicator": "Economic indicator (GDP, GDP_GROWTH, GDP_PER_CAPITA, GNI, GNI_PER_CAPITA, EXPORTS_GDP, FDI_NET, INFLATION, UNEMPLOYMENT)",
    "years": "Number of years to query (optional, default 10 years)"
  }
}
```

### 5. Get Social Development Data
```json
{
  "name": "get-social-data",
  "description": "Get social development data for a country", 
  "parameters": {
    "countryCode": "Country code",
    "indicator": "Social indicator (POPULATION, LIFE_EXPECTANCY, BIRTH_RATE, DEATH_RATE, INTERNET_USERS)",
    "years": "Number of years to query (optional, default 10 years)"
  }
}
```

### 6. Get Education Data
```json
{
  "name": "get-education-data",
  "description": "Get education data for a country", 
  "parameters": {
    "countryCode": "Country code",
    "indicator": "Education indicator (LITERACY_RATE, SCHOOL_ENROLLMENT, SCHOOL_COMPLETION, TEACHERS_PRIMARY, EDUCATION_EXPENDITURE)",
    "years": "Number of years to query (optional, default 10 years)"
  }
}
```

### 7. Get Health and Nutrition Data
```json
{
  "name": "get-health-data",
  "description": "Get health and nutrition data for a country", 
  "parameters": {
    "countryCode": "Country code",
    "indicator": "Health indicator (HEALTH_EXPENDITURE, PHYSICIANS, HOSPITAL_BEDS, IMMUNIZATION, HIV_PREVALENCE, MALNUTRITION, TUBERCULOSIS)",
    "years": "Number of years to query (optional, default 10 years)"
  }
}
```

## Supported Economic Indicators

| Indicator Code | Description | Unit |
|---------|------|------|
| GDP | Gross Domestic Product | Current US$ |
| GDP_GROWTH | GDP growth rate | Annual % |
| GDP_PER_CAPITA | GDP per capita | Current US$ |
| GNI | Gross National Income | Current US$ |
| GNI_PER_CAPITA | GNI per capita | Current US$ |
| EXPORTS_GDP | Exports of goods and services | % of GDP |
| FDI_NET | Foreign direct investment, net inflows | Current US$ |
| INFLATION | Inflation rate | Annual % |
| UNEMPLOYMENT | Unemployment rate | % of total labor force |

## Supported Social Indicators

| Indicator Code | Description | Unit |
|---------|------|------|
| POPULATION | Population, total | People |
| LIFE_EXPECTANCY | Life expectancy at birth | Years |
| BIRTH_RATE | Birth rate | per 1,000 people |
| DEATH_RATE | Death rate | per 1,000 people |
| INTERNET_USERS | Internet users | % of population |

## Supported Education Indicators

| Indicator Code | Description | Unit |
|---------|------|------|
| LITERACY_RATE | Literacy rate | % of people ages 15 and above |
| SCHOOL_ENROLLMENT | School enrollment, primary | % gross |
| SCHOOL_COMPLETION | Primary completion rate | % of relevant age group |
| TEACHERS_PRIMARY | Teachers in primary education | Count |
| EDUCATION_EXPENDITURE | Government expenditure on education | % of GDP |

## Supported Health and Nutrition Indicators

| Indicator Code | Description | Unit |
|---------|------|------|
| HEALTH_EXPENDITURE | Current health expenditure | % of GDP |
| PHYSICIANS | Physicians | per 1,000 people |
| HOSPITAL_BEDS | Hospital beds | per 1,000 people |
| IMMUNIZATION | Immunization, measles | % of children ages 12-23 months |
| HIV_PREVALENCE | Prevalence of HIV | % of population ages 15-49 |
| MALNUTRITION | Prevalence of undernourishment | % of population |
| TUBERCULOSIS | Incidence of tuberculosis | per 100,000 people |

## Common Country Codes

| Country | Code | Country | Code |
|------|------|------|------|
| China | CN | United States | US |
| Japan | JP | Germany | DE |
| United Kingdom | GB | France | FR |
| India | IN | Brazil | BR |
| Russia | RU | Australia | AU |

## Project Structure

```
worldbank-mcp/
├── src/
│   ├── index.ts      # Main entry file
│   └── types.ts      # Type definitions
├── build/            # Compiled output
├── package.json      # Project configuration
├── tsconfig.json     # TypeScript configuration
└── README.md         # Documentation
```

## Technology Stack

- **TypeScript** - Type-safe development language
- **Model Context Protocol SDK** - MCP protocol implementation
- **Axios** - HTTP client
- **Zod** - Data validation
- **Commander** - Command-line tool

## API Endpoints

Project uses World Bank Open Data API:
- Base URL: `https://api.worldbank.org/v2`
- Country data: `/countries`
- Indicator data: `/indicators`
- Country indicator data: `/country/{code}/indicator/{id}`

## Development Notes

This project is based on MCP protocol standard architecture, integrates World Bank Open Data API, and provides global economic data query services.