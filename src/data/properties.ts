// Property images - Casa 1
import casa1Cover from "@/assets/properties/casa-1/cover.webp";
import casa1Photo2 from "@/assets/properties/casa-1/photo-2.webp";
import casa1Photo3 from "@/assets/properties/casa-1/photo-3.webp";
import casa1Photo4 from "@/assets/properties/casa-1/photo-4.webp";
import casa1Photo5 from "@/assets/properties/casa-1/photo-5.webp";
import casa1Photo6 from "@/assets/properties/casa-1/photo-6.webp";
import casa1Photo7 from "@/assets/properties/casa-1/photo-7.webp";
import casa1Photo8 from "@/assets/properties/casa-1/photo-8.webp";
import casa1Photo9 from "@/assets/properties/casa-1/photo-9.webp";
import casa1Photo10 from "@/assets/properties/casa-1/photo-10.webp";

// Property images - Casa 2
import casa2Cover from "@/assets/properties/casa-2/cover.webp";
import casa2Photo2 from "@/assets/properties/casa-2/photo-2.webp";
import casa2Photo3 from "@/assets/properties/casa-2/photo-3.webp";
import casa2Photo4 from "@/assets/properties/casa-2/photo-4.webp";
import casa2Photo5 from "@/assets/properties/casa-2/photo-5.webp";
import casa2Photo6 from "@/assets/properties/casa-2/photo-6.webp";
import casa2Photo7 from "@/assets/properties/casa-2/photo-7.webp";
import casa2Photo8 from "@/assets/properties/casa-2/photo-8.webp";
import casa2Photo9 from "@/assets/properties/casa-2/photo-9.webp";

// Property images - Casa 3
import casa3Cover from "@/assets/properties/casa-3/cover.jpg";

// Property images - Casa 4
import casa4Cover from "@/assets/properties/casa-4/cover.webp";
import casa4Photo2 from "@/assets/properties/casa-4/photo-2.webp";
import casa4Photo3 from "@/assets/properties/casa-4/photo-3.webp";
import casa4Photo4 from "@/assets/properties/casa-4/photo-4.webp";
import casa4Photo5 from "@/assets/properties/casa-4/photo-5.webp";
import casa4Photo6 from "@/assets/properties/casa-4/photo-6.webp";
import casa4Photo7 from "@/assets/properties/casa-4/photo-7.webp";
import casa4Photo8 from "@/assets/properties/casa-4/photo-8.webp";
import casa4Photo9 from "@/assets/properties/casa-4/photo-9.webp";
import casa4Photo10 from "@/assets/properties/casa-4/photo-10.webp";

export type PropertyStatus = "available" | "in_contract" | "sold" | "in_renovation";

export interface Property {
  id: string;
  address: string;
  status: PropertyStatus;
  coverImage: string;
  images: string[];
  externalLink: string;
}

// Properties data - ordered from newest to oldest
export const properties: Property[] = [
  {
    id: "casa-4",
    address: "8 Rumsey St, Seneca Falls, NY",
    status: "in_renovation",
    coverImage: casa4Cover,
    images: [
      casa4Cover,
      casa4Photo2,
      casa4Photo3,
      casa4Photo4,
      casa4Photo5,
      casa4Photo6,
      casa4Photo7,
      casa4Photo8,
      casa4Photo9,
      casa4Photo10,
    ],
    externalLink: "https://www.zillow.com/homedetails/107-Coolidge-Ave-Elkland-PA-16920/230067442_zpid/",
  },
  {
    id: "casa-3",
    address: "107 Coolidge Ave, Elkland, PA",
    status: "in_renovation",
    coverImage: casa3Cover,
    images: [casa3Cover],
    externalLink: "https://www.zillow.com/homedetails/107-Coolidge-Ave-Elkland-PA-16920/230067442_zpid/",
  },
  {
    id: "casa-2",
    address: "506 Luce St, Elmira, NY 14904",
    status: "sold",
    coverImage: casa2Cover,
    images: [
      casa2Cover,
      casa2Photo2,
      casa2Photo3,
      casa2Photo4,
      casa2Photo5,
      casa2Photo6,
      casa2Photo7,
      casa2Photo8,
      casa2Photo9,
    ],
    externalLink: "https://www.zillow.com/homedetails/506-Luce-St-Elmira-NY-14904/29960311_zpid/",
  },
  {
    id: "casa-1",
    address: "501 W Hudson, Elmira, NY",
    status: "in_contract",
    coverImage: casa1Cover,
    images: [
      casa1Cover,
      casa1Photo2,
      casa1Photo3,
      casa1Photo4,
      casa1Photo5,
      casa1Photo6,
      casa1Photo7,
      casa1Photo8,
      casa1Photo9,
      casa1Photo10,
    ],
    externalLink: "https://www.zillow.com/homedetails/501-W-Hudson-St-Elmira-NY-14904/29957315_zpid/",
  },
];

// Get the latest N properties
export const getLatestProperties = (count: number): Property[] => {
  return properties.slice(0, count);
};
