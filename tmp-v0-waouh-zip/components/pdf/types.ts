export interface CoverLogos {
  client?: string;
  entreprise?: string;
}

export interface Stats {
  zonesCount: number;
  billboardsCount: number;
  duration: string;
}

export interface Zone {
  index: number;
  name: string;
  gpsCoordinates: string;
  timestamp: string;
  faceALabel: string;
  faceBLabel: string;
  faceAImage?: string;
  faceBImage?: string;
}

export interface Closing {
  heading: string;
  body: string;
  signatureLabel: string;
  signatureValue: string;
}

export interface PDFData {
  campaignName: string;
  clientLine: string;
  zoneLine: string;
  date: string;
  coverLogos: CoverLogos;
  stats: Stats;
  noteResume: string;
  zones: Zone[];
  closing: Closing;
  footerBrand: string;
  footerNote: string;
  primaryColor: string;
}
