"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── ZIP to City lookup (top cities by 3-digit prefix) ───
const ZIP_CITIES: Record<string, string> = {
  "100": "New York, NY", "101": "New York, NY", "102": "New York, NY",
  "200": "Washington, DC", "201": "Washington, DC",
  "300": "Atlanta, GA", "303": "Atlanta, GA", "304": "Atlanta, GA",
  "331": "Miami, FL", "332": "Miami, FL", "333": "Fort Lauderdale, FL",
  "606": "Chicago, IL", "607": "Chicago, IL", "608": "Chicago, IL",
  "770": "Houston, TX", "773": "Houston, TX",
  "750": "Dallas, TX", "751": "Dallas, TX", "752": "Dallas, TX",
  "852": "Phoenix, AZ", "853": "Phoenix, AZ",
  "191": "Philadelphia, PA", "190": "Philadelphia, PA",
  "782": "San Antonio, TX", "783": "San Antonio, TX",
  "921": "San Diego, CA", "922": "San Diego, CA",
  "900": "Los Angeles, CA", "901": "Los Angeles, CA", "902": "Los Angeles, CA",
  "941": "San Francisco, CA", "940": "San Francisco, CA",
  "980": "Seattle, WA", "981": "Seattle, WA",
  "802": "Denver, CO", "801": "Denver, CO",
  "372": "Nashville, TN", "371": "Nashville, TN",
  "787": "Austin, TX", "786": "Austin, TX",
  "432": "Columbus, OH", "430": "Columbus, OH",
  "462": "Indianapolis, IN", "461": "Indianapolis, IN",
  "282": "Charlotte, NC", "281": "Charlotte, NC", "284": "Raleigh, NC",
  "481": "Detroit, MI", "482": "Detroit, MI",
  "554": "Minneapolis, MN", "553": "Minneapolis, MN",
  "641": "Kansas City, MO", "640": "Kansas City, MO",
  "631": "St. Louis, MO", "630": "St. Louis, MO",
  "336": "Tampa, FL", "337": "Tampa, FL",
  "327": "Orlando, FL", "328": "Orlando, FL",
  "152": "Pittsburgh, PA", "150": "Pittsburgh, PA",
  "841": "Salt Lake City, UT",
  "021": "Boston, MA", "022": "Boston, MA",
  "971": "Portland, OR", "970": "Portland, OR",
  "891": "Las Vegas, NV", "890": "Las Vegas, NV",
  "530": "Milwaukee, WI", "531": "Milwaukee, WI",
  "352": "Jacksonville, FL", "731": "Oklahoma City, OK",
  "495": "Grand Rapids, MI", "494": "Grand Rapids, MI",
};

function getCityFromZip(zip: string): string | null {
  if (zip.length < 3) return null;
  return ZIP_CITIES[zip.substring(0, 3)] || null;
}

// ─── Icons for visual card selectors ───
function CardIcon({ fieldName, value }: { fieldName: string; value: string }) {
  const icons: Record<string, Record<string, string>> = {
    currentlyInsured: { yes: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z", no: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
    homeowner: { yes: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25", no: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" },
    married: { yes: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z", no: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
    gender: { male: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z", female: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z", other: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" },
    creditScore: { excellent: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z", good: "M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3.25a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 .714-.088 1.408-.254 2.073M6.633 10.25H5.25A2.25 2.25 0 003 12.5v1a2.25 2.25 0 002.25 2.25h1.068c.68 0 1.258.492 1.37 1.163l.275 1.65A2.25 2.25 0 0010.184 20h.116a2.25 2.25 0 002.25-2.25V15M6.633 10.25h4.117m0 0h3.5a2.25 2.25 0 002.25-2.25V5.25", fair: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z", poor: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" },
    accidents: { none: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "1": "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z", "2+": "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
    coverageLevel: { minimum: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z", standard: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z", full: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z", premium: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-3.77 1.522m0 0a6.003 6.003 0 01-3.77-1.522" },
    vehicleCount: { "1": "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12", "2": "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12", "3+": "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
    propertyType: { single_family: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25", condo: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m7.5 0h2.25", multi_family: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21", mobile: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21V6.375c0-.621-.504-1.125-1.125-1.125h-5.25c-.621 0-1.125.504-1.125 1.125v3.659" },
    coverageFor: { individual: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z", couple: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z", family: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z", child: "M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" },
    tobacco: { yes: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z", no: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    claims: { "0": "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "1": "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z", "2+": "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" },
    businessType: { llc: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m7.5 0h2.25", sole_prop: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z", corp: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21", partnership: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
    employees: { "1": "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z", "2-10": "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z", "11-50": "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z", "50+": "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" },
    coverageAmount: { "100k": "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "250k": "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "500k": "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "1m": "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  };
  const path = icons[fieldName]?.[value];
  if (!path) return null;
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
    </svg>
  );
}

// ─── Encouragement messages ───
const ENCOURAGEMENTS = ["Great choice!", "Perfect!", "Nice!", "Got it!", "Excellent!"];
function getEncouragement(): string {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

// ─── Carrier names ───
const CARRIERS = ["GEICO", "Progressive", "State Farm", "Allstate", "Liberty Mutual", "USAA", "Nationwide", "Farmers"];

// ─── Types ───
interface Question {
  id: string;
  label: string;
  fieldName: string;
  fieldType: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  validation?: Record<string, unknown>;
}

interface Step {
  id: string;
  title: string;
  description?: string;
  order: number;
  questions: Question[];
}

interface FormConfig {
  insuranceType: { id: string; name: string; label: string };
  steps: Step[];
}

// ─── Category mapping for progress display ───
function getStepCategory(step: Step): string {
  const t = step.title.toLowerCase();
  if (t.includes("zip") || t.includes("location")) return "Location";
  if (t.includes("vehicle") || t.includes("car") || t.includes("make")) return "Vehicle";
  if (t.includes("driver") || t.includes("gender") || t.includes("credit") || t.includes("accident") || t.includes("married") || t.includes("homeowner") || t.includes("own your")) return "About You";
  if (t.includes("coverage") || t.includes("insured") || t.includes("carrier")) return "Coverage";
  if (t.includes("name") || t.includes("contact") || t.includes("email") || t.includes("quote") || t.includes("done") || t.includes("send")) return "Contact";
  if (t.includes("property") || t.includes("roof") || t.includes("value") || t.includes("built") || t.includes("square")) return "Property";
  if (t.includes("health") || t.includes("who needs")) return "Health";
  if (t.includes("life") || t.includes("tobacco")) return "Life";
  if (t.includes("business") || t.includes("industry") || t.includes("employee") || t.includes("revenue")) return "Business";
  return "Details";
}

// ─── Main Form Component ───
function QuoteFormInner() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "auto";

  const [config, setConfig] = useState<FormConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"right" | "left">("right");
  const [slideKey, setSlideKey] = useState(0);
  const [encouragement, setEncouragement] = useState("");
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [cityDisplay, setCityDisplay] = useState<string | null>(null);
  const [liveCount] = useState(() => {
    const hour = new Date().getHours();
    const base = hour >= 9 && hour <= 17 ? 2400 : hour >= 6 && hour <= 21 ? 1800 : 900;
    return base + Math.floor(Math.random() * 500);
  });

  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const leadIdRef = useRef<string | null>(null);
  const formDataRef = useRef<Record<string, string>>({});

  // Keep refs in sync
  useEffect(() => { leadIdRef.current = leadId; }, [leadId]);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // Load form config
  useEffect(() => {
    fetch(`/api/leads/config?type=${type}`)
      .then((r) => r.json())
      .then((data) => { setConfig(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [type]);

  // Generate session ID
  useEffect(() => {
    setSessionId(`sess_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  }, []);

  // Auto-focus input on step change
  useEffect(() => {
    const t = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 400);
    return () => clearTimeout(t);
  }, [currentStep]);

  // Track step views
  const trackEvent = useCallback(
    async (eventType: string, stepId?: string, metadata?: Record<string, unknown>) => {
      if (!leadIdRef.current && eventType !== "step_viewed") return;
      try {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: leadIdRef.current, sessionId, stepId, eventType, metadata }),
        });
      } catch { /* silent */ }
    },
    [sessionId]
  );

  useEffect(() => {
    if (config && config.steps[currentStep]) {
      trackEvent("step_viewed", config.steps[currentStep].id);
    }
  }, [currentStep, config, trackEvent]);

  // Cleanup timer
  useEffect(() => {
    return () => { if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current); };
  }, []);

  const validateStep = useCallback(() => {
    if (!config) return false;
    const step = config.steps[currentStep];
    const newErrors: Record<string, string> = {};
    const fd = formDataRef.current;

    for (const q of step.questions) {
      const value = fd[q.fieldName] || "";
      if (q.required && !value.trim()) newErrors[q.fieldName] = `${q.label} is required`;
      if (q.fieldType === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors[q.fieldName] = "Please enter a valid email";
      if (q.fieldType === "zip" && value && !/^\d{5}$/.test(value)) newErrors[q.fieldName] = "Please enter a valid 5-digit ZIP code";
      if (q.fieldType === "tel" && value && !/^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(value)) newErrors[q.fieldName] = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [config, currentStep]);

  const createOrUpdateLead = useCallback(async (stepNum: number, isCompleted = false) => {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: leadIdRef.current,
        sessionId,
        insuranceType: type,
        data: formDataRef.current,
        lastStepReached: stepNum,
        completed: isCompleted,
      }),
    });
    const data = await res.json();
    if (data.id && !leadIdRef.current) {
      leadIdRef.current = data.id;
      setLeadId(data.id);
    }
    return data;
  }, [sessionId, type]);

  const goToNextStep = useCallback(async () => {
    if (!config) return;
    if (!validateStep()) return;

    const stepNum = currentStep + 1;
    await createOrUpdateLead(stepNum);
    await trackEvent("step_completed", config.steps[currentStep].id);

    if (currentStep < config.steps.length - 1) {
      setEncouragement(getEncouragement());
      setShowEncouragement(true);
      setTimeout(() => setShowEncouragement(false), 1200);
      setSlideDirection("right");
      setSlideKey((k) => k + 1);
      setCurrentStep((s) => s + 1);
    } else {
      setSubmitting(true);
      await createOrUpdateLead(stepNum, true);
      await trackEvent("form_completed", config.steps[currentStep].id);
      setSubmitting(false);
      setCompleted(true);
    }
  }, [config, currentStep, validateStep, createOrUpdateLead, trackEvent]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setSlideDirection("left");
      setSlideKey((k) => k + 1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const scheduleAutoAdvance = useCallback((delayMs = 400) => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => goToNextStep(), delayMs);
  }, [goToNextStep]);

  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [fieldName]: value };
      formDataRef.current = next;
      return next;
    });
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  const handleCardSelect = useCallback((fieldName: string, value: string, isOnlyQuestion: boolean) => {
    handleFieldChange(fieldName, value);
    if (isOnlyQuestion) scheduleAutoAdvance(350);
  }, [handleFieldChange, scheduleAutoAdvance]);

  const handleZipChange = useCallback((fieldName: string, value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 5);
    handleFieldChange(fieldName, digits);
    setCityDisplay(digits.length >= 3 ? getCityFromZip(digits) : null);
    if (digits.length === 5) {
      const step = config?.steps[currentStep];
      if (step && step.questions.length === 1) scheduleAutoAdvance(500);
    }
  }, [handleFieldChange, config, currentStep, scheduleAutoAdvance]);

  const handleSelectChange = useCallback((fieldName: string, value: string, isOnlyQuestion: boolean) => {
    handleFieldChange(fieldName, value);
    if (isOnlyQuestion && value) scheduleAutoAdvance(350);
  }, [handleFieldChange, scheduleAutoAdvance]);

  // Keyboard navigation
  useEffect(() => {
    if (!config || completed) return;
    const step = config.steps[currentStep];
    if (!step) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          goToNextStep();
        }
        return;
      }

      if (step.questions.length === 1) {
        const q = step.questions[0];
        if ((q.fieldType === "radio" || q.fieldType === "select") && q.options) {
          const num = parseInt(e.key);
          if (num >= 1 && num <= q.options.length) {
            e.preventDefault();
            handleCardSelect(q.fieldName, q.options[num - 1].value, true);
            return;
          }
        }
      }

      if (e.key === "Enter") { e.preventDefault(); goToNextStep(); }
      if (e.key === "Escape") handleBack();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config, currentStep, completed, handleCardSelect, goToNextStep, handleBack]);

  // ─── RENDER ───

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (!config || config.steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Form Not Available</h2>
          <p className="text-gray-500 mb-4">This insurance type is not configured yet.</p>
          <Link href="/" className="btn-primary inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={`confetti-piece confetti-${i + 1}`} />
          ))}
        </div>
        <div className="card max-w-lg w-full text-center py-12 relative z-10">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h2>
          <p className="text-lg text-gray-600 mb-6">
            We&apos;re matching you with top {config.insuranceType.label.toLowerCase()} providers now.
          </p>
          <div className="bg-emerald-50 rounded-2xl p-6 mb-6">
            <p className="text-sm text-emerald-700 font-medium mb-1">Average savings</p>
            <p className="text-4xl font-bold text-emerald-700">$547<span className="text-lg">/year</span></p>
            <p className="text-sm text-emerald-600 mt-1">Based on similar profiles in your area</p>
          </div>
          <p className="text-sm text-gray-400 mb-8">Personalized quotes arriving in your inbox within minutes.</p>
          <Link href="/" className="btn-primary inline-block">Compare More Insurance</Link>
        </div>
      </div>
    );
  }

  const step = config.steps[currentStep];
  const totalSteps = config.steps.length;
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 100;
  const isOnlyQuestion = step.questions.length === 1;
  const isLastStep = currentStep === totalSteps - 1;
  const isContactStep = step.questions.some(q => q.fieldType === "email" || q.fieldType === "tel");
  const hasAutoAdvance = isOnlyQuestion && !isContactStep && step.questions[0] && (
    step.questions[0].fieldType === "radio" ||
    step.questions[0].fieldType === "zip" ||
    (step.questions[0].fieldType === "select" && (step.questions[0].options?.length || 0) <= 6)
  );

  // Build category pills
  const categories = config.steps.reduce<{ label: string; startIndex: number }[]>((acc, s, i) => {
    const cat = getStepCategory(s);
    if (acc.length === 0 || acc[acc.length - 1].label !== cat) {
      acc.push({ label: cat, startIndex: i });
    }
    return acc;
  }, []);
  const currentCategory = getStepCategory(step);

  // Render a visual card option
  const renderCardOption = (q: Question, opt: { value: string; label: string }, index: number, singleQ: boolean) => {
    const isSelected = formData[q.fieldName] === opt.value;
    return (
      <button
        key={opt.value}
        type="button"
        onClick={() => handleCardSelect(q.fieldName, opt.value, singleQ)}
        className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 min-h-[100px]
          ${isSelected
            ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 animate-select-bounce"
            : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
          }`}
      >
        {isSelected && (
          <div className="absolute top-2 right-2">
            <svg className="w-6 h-6 text-indigo-600 animate-check-draw" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        <div className={`${isSelected ? "text-indigo-600" : "text-gray-400"} transition-colors`}>
          <CardIcon fieldName={q.fieldName} value={opt.value} />
        </div>
        <span className={`text-sm sm:text-base font-medium text-center ${isSelected ? "text-indigo-700" : "text-gray-700"}`}>
          {opt.label}
        </span>
        {singleQ && (
          <span className="kbd-badge hidden sm:inline-flex absolute bottom-2 right-2">{index + 1}</span>
        )}
      </button>
    );
  };

  // Render a question
  const renderQuestion = (q: Question, singleQ: boolean) => {
    const hasVisualCards = (q.fieldType === "radio" || q.fieldType === "select") && q.options && q.options.length <= 6;

    if (hasVisualCards && q.options) {
      const n = q.options.length;
      const gridCols = n <= 2 ? "grid-cols-2" : n <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4";
      return (
        <div key={q.id}>
          <div className={`grid ${gridCols} gap-3`}>
            {q.options.map((opt, i) => renderCardOption(q, opt, i, singleQ))}
          </div>
          {errors[q.fieldName] && <p className="text-sm text-red-500 mt-2">{errors[q.fieldName]}</p>}
        </div>
      );
    }

    if (q.fieldType === "select" && q.options) {
      return (
        <div key={q.id}>
          <select
            className="input-field text-lg"
            value={formData[q.fieldName] || ""}
            onChange={(e) => handleSelectChange(q.fieldName, e.target.value, singleQ)}
          >
            <option value="">{q.placeholder || "Select..."}</option>
            {q.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors[q.fieldName] && <p className="text-sm text-red-500 mt-2">{errors[q.fieldName]}</p>}
        </div>
      );
    }

    if (q.fieldType === "zip") {
      return (
        <div key={q.id}>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            className={`input-field text-center text-3xl tracking-[0.3em] font-bold ${formData[q.fieldName]?.length === 5 ? "input-valid" : ""}`}
            placeholder="00000"
            value={formData[q.fieldName] || ""}
            onChange={(e) => handleZipChange(q.fieldName, e.target.value)}
            maxLength={5}
            autoFocus
          />
          {cityDisplay && formData[q.fieldName]?.length >= 3 && (
            <div className="mt-3 flex items-center justify-center gap-2 text-emerald-600 animate-fade-in">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="font-medium">{cityDisplay}</span>
            </div>
          )}
          {errors[q.fieldName] && <p className="text-sm text-red-500 mt-2 text-center">{errors[q.fieldName]}</p>}
        </div>
      );
    }

    if (q.fieldType === "checkbox") {
      return (
        <div key={q.id}>
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-colors">
            <input
              type="checkbox"
              checked={formData[q.fieldName] === "true"}
              onChange={(e) => handleFieldChange(q.fieldName, e.target.checked ? "true" : "false")}
              className="w-6 h-6 text-indigo-600 rounded-lg"
            />
            <span className="text-lg text-gray-700">{q.placeholder || q.label}</span>
          </label>
        </div>
      );
    }

    // Text / email / tel / number / date
    return (
      <div key={q.id}>
        {!singleQ && <label className="block text-sm font-medium text-gray-500 mb-2">{q.label}</label>}
        <input
          ref={singleQ ? inputRef : undefined}
          type={q.fieldType === "number" ? "number" : q.fieldType}
          inputMode={q.fieldType === "tel" ? "tel" : q.fieldType === "email" ? "email" : q.fieldType === "number" ? "numeric" : undefined}
          className={`input-field text-lg ${formData[q.fieldName] ? "input-valid" : ""}`}
          placeholder={q.placeholder || `Enter ${q.label.toLowerCase()}`}
          value={formData[q.fieldName] || ""}
          onChange={(e) => handleFieldChange(q.fieldName, e.target.value)}
          autoFocus={singleQ}
        />
        {q.helpText && <p className="text-xs text-gray-400 mt-1">{q.helpText}</p>}
        {errors[q.fieldName] && <p className="text-sm text-red-500 mt-2">{errors[q.fieldName]}</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex flex-col">
      {/* Trust bar */}
      <div className="bg-indigo-900 text-white py-2 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-6 text-xs sm:text-sm">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            256-bit Encrypted
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            Rated 4.8/5
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            100% Free
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-indigo-700">InsureCompare</Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{config.insuranceType.label}</span>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
              {liveCount.toLocaleString()} comparing today
            </span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-gray-100 h-1.5">
        <div className="bg-indigo-600 h-1.5 progress-bar progress-glow rounded-r-full" style={{ width: `${Math.max(progress, 3)}%` }} />
      </div>

      {/* Category pills */}
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {categories.map((cat, i) => {
            const isActive = currentCategory === cat.label;
            const isPast = cat.startIndex < currentStep && !isActive;
            return (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && <div className={`w-4 h-px ${isPast ? "bg-emerald-400" : "bg-gray-200"}`} />}
                <span className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                  isActive ? "bg-indigo-100 text-indigo-700" :
                  isPast ? "bg-emerald-50 text-emerald-600" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {isPast ? "\u2713 " : ""}{cat.label}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Question {currentStep + 1} of {totalSteps}
          {!isLastStep && <span> &middot; About {Math.max(1, Math.ceil((totalSteps - currentStep) * 0.3))} min left</span>}
        </p>
      </div>

      {/* Encouragement toast */}
      {showEncouragement && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
            {encouragement}
          </div>
        </div>
      )}

      {/* Form content */}
      <div className="flex-1 flex items-start sm:items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-xl">
          <div key={slideKey} className={slideDirection === "right" ? "slide-in-right" : "slide-in-left"}>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">{step.title}</h2>
            {step.description && <p className="text-gray-500 text-center mb-8">{step.description}</p>}
            {!step.description && <div className="mb-8" />}

            <div className="space-y-6">
              {step.questions.map((q) => renderQuestion(q, isOnlyQuestion))}
            </div>

            {!hasAutoAdvance && (
              <div className="mt-8">
                <button onClick={goToNextStep} disabled={submitting} className="btn-primary w-full text-center">
                  {submitting ? "Submitting..." : isLastStep ? "Get My Free Quotes" : "Continue"}
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              {currentStep > 0 ? (
                <button onClick={handleBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">&larr; Back</button>
              ) : (
                <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">&larr; Back to home</Link>
              )}
            </div>

            {hasAutoAdvance && (
              <p className="text-xs text-gray-300 text-center mt-6 hidden sm:block">
                Press 1-{step.questions[0]?.options?.length || 0} to select &middot; Esc to go back
              </p>
            )}
            {!hasAutoAdvance && !isContactStep && (
              <p className="text-xs text-gray-300 text-center mt-4 hidden sm:block">
                Press Enter to continue &middot; Esc to go back
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Carrier logos */}
      <div className="py-4 px-4 border-t border-gray-100 bg-white/50">
        <p className="text-xs text-gray-400 text-center mb-3">Comparing top carriers</p>
        <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
          {CARRIERS.map((name) => (
            <span key={name} className="text-xs sm:text-sm font-medium text-gray-300">{name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    }>
      <QuoteFormInner />
    </Suspense>
  );
}
