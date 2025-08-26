export interface Country {
    id: string;
    iso2Code: string;
    name: string;
    region: Region;
    adminregion: Region;
    incomeLevel: Region;
    lendingType: Region;
    capitalCity: string;
    longitude: string;
    latitude: string;
}
export interface Region {
    id: string;
    iso2code: string;
    value: string;
}
export interface Indicator {
    id: string;
    name: string;
    unit: string;
    source: Source;
    sourceNote: string;
    sourceOrganization: string;
    topics: Topic[];
}
export interface Source {
    id: string;
    value: string;
}
export interface Topic {
    id: string;
    value: string;
}
export interface DataPoint {
    indicator: {
        id: string;
        value: string;
    };
    country: {
        id: string;
        value: string;
    };
    countryiso3code: string;
    date: string;
    value: number;
    unit: string;
    obs_status: string;
    decimal: number;
}
export interface WorldBankResponse<T> {
    page: number;
    pages: number;
    per_page: number;
    total: number;
    lastupdated: string;
    [key: string]: T[] | number | string;
}
export interface QueryParams {
    format?: string;
    per_page?: number;
    page?: number;
    [key: string]: string | number | undefined;
}
//# sourceMappingURL=types.d.ts.map