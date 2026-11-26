// LeadGen — Lead Generation Intelligence Dashboard (VS Code static version, v6 A+ rebuild)
// Static, localStorage, no backend. Copy drafts only — nothing is sent automatically.
// Theme: Light / AMOLED — follows system on first visit, saved in localStorage.
// Security: ALL user/imported data is escaped at render time (esc() escapes & < > " ' `).
// Honest limits: realistic daily target is 10-20 researched leads/day, NOT 100/source/day.
// LinkedIn/Facebook group monitoring is NOT available (no official API) — see Guide/Settings.
(function(){
  const saved = (typeof localStorage !== "undefined") ? localStorage.getItem("leadgen_theme") : null;
  const theme = saved || (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "amoled" : "light");
  if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", theme);
})();

// ---------- Unique IDs (never Date.now() alone — two saves in one ms used to collide) ----------
let __idCounter = 0;
function nextId(list){
  let max = 0;
  (list||[]).forEach(x=>{ const n = +x.id; if(Number.isFinite(n) && n > max) max = n; });
  __idCounter += 1;
  return Math.max(max + 1, Date.now() % 100000000 + __idCounter);
}

// ---------- Real links only ----------
// A link is only rendered when it is a real https:// URL. Never a dead placeholder.
// - Website: only when the lead has a real https:// company site.
// - Google Maps: a search URL for the business name + city — always loads.
// - Platform: a real platform page that loads. Never invent a personal profile URL
//   for a fictional sample person (no linkedin.com/in/made-up-name).
function isRealUrl(u){
  if(typeof u !== "string") return false;
  const s = u.trim();
  if(!/^https:\/\//i.test(s)) return false;
  let host = "";
  try{ host = new URL(s).hostname.toLowerCase(); }catch(e){ return false; }
  if(!host || host.indexOf(".") === -1) return false;
  if(host === "example" + ".com" || host.endsWith("." + "example") || host.endsWith(".test") || host.endsWith(".invalid") || host === "localhost" || host.endsWith(".localhost")) return false;
  if(s.toLowerCase().indexOf("." + "example") !== -1) return false;
  return true;
}
// A stored profile link must be on the right platform, not just any https:// URL.
function isProfileUrl(u, domain){
  if(!isRealUrl(u)) return false;
  try{ return new URL(u.trim()).hostname.toLowerCase().endsWith(domain); }catch(e){ return false; }
}
function mapsLink(l){
  const q = [l.company || l.name, l.location].filter(Boolean).join(" ");
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
}
function fbSearchLink(name){
  return "https://www.facebook.com/search/top?q=" + encodeURIComponent(name);
}
function platformLink(l){
  const q = encodeURIComponent(l.name);
  const sq = encodeURIComponent(l.company);
  switch(l.source){
    case "LinkedIn": return {label:"LinkedIn search", url:"https://www.linkedin.com/search/results/people/?keywords=" + q};
    case "Facebook": return {label:"Facebook search", url:fbSearchLink(l.name)};
    case "Upwork": return {label:"Upwork jobs", url:"https://www.upwork.com/search/jobs/?q=" + encodeURIComponent(l.want || l.company)};
    case "Reddit": {
      const m = /r\/([A-Za-z0-9_]+)/.exec(l.group || "");
      return m ? {label:"Reddit · r/" + m[1], url:"https://www.reddit.com/r/" + m[1] + "/"}
               : {label:"Reddit", url:"https://www.reddit.com/"};
    }
    case "X": return {label:"X search", url:"https://x.com/search?q=" + q};
    case "Indie Hackers": return {label:"Indie Hackers", url:"https://www.indiehackers.com/"};
    case "Clutch": return {label:"Clutch", url:"https://clutch.co/"};
    case "Web Search": return {label:"Google search", url:"https://www.google.com/search?q=" + sq};
    case "Google Maps": return {label:"Google Maps", url:mapsLink(l)};
    default: return {label:l.source, url:"https://www.google.com/search?q=" + sq};
  }
}
function storedLinks(l){
  const out = [];
  if(isProfileUrl(l.linkedinUrl, "linkedin.com")) out.push({label:"LinkedIn profile", url:l.linkedinUrl});
  if(isProfileUrl(l.facebookUrl, "facebook.com")) out.push({label:"Facebook", url:l.facebookUrl});
  if(isProfileUrl(l.upworkUrl, "upwork.com")) out.push({label:"Upwork", url:l.upworkUrl});
  if(isProfileUrl(l.redditUrl, "reddit.com")) out.push({label:"Reddit post", url:l.redditUrl});
  if(isProfileUrl(l.xUrl, "x.com") || isProfileUrl(l.xUrl, "twitter.com")) out.push({label:"X", url:l.xUrl});
  if(isProfileUrl(l.behanceUrl, "behance.net")) out.push({label:"Behance", url:l.behanceUrl});
  if(isProfileUrl(l.dribbbleUrl, "dribbble.com")) out.push({label:"Dribbble", url:l.dribbbleUrl});
  return out;
}

// ---------- SAMPLE DATA ONLY: fictional demo leads, clearly marked SAMPLE ----------
// No fake websites: every sample lead has website "" (no website).
// Their working links are the Google Maps search link and the real platform link.
// Never invent a real person's email — leave blank if not publicly found.
const SAMPLE = [
 // LinkedIn — 10
 ["Ayesha Rahman","CEO","Northwind SaaS","SaaS","Dhaka, Bangladesh","High",92,"Our SaaS landing page does not convert trial signups.","Full landing page redesign + clearer pricing","Visitors leave without signing up; hero is unclear; pricing is confusing","Urgent — hiring this month, budget mentioned","LinkedIn","SaaS Founders — Group"],
 ["Omar Faruk","Founder","BrightCart Store","eCommerce","Dubai, UAE","High",88,"Our Shopify store looks outdated and checkout drops off.","eCommerce website redesign","Outdated design; slow checkout; weak trust signals","ASAP — wants launch in 3 weeks","LinkedIn","eCommerce Business Owners"],
 ["Sara Ahmed","Co-Founder","MediCare Plus","Healthcare","London, UK","High",90,"Patients cannot book easily on mobile.","Mobile app UI + booking flow redesign","Mobile booking is confusing; forms are too long","Soon — budget approved","LinkedIn","Startup Founders — SaaS"],
 ["Tanvir Hasan","CEO","Finlytic","FinTech","New York, USA","Medium",81,"Our dashboard is powerful but users get lost.","Dashboard / SaaS UI redesign","Dense dashboard; no hierarchy; onboarding is weak","Exploring — Q1 project","LinkedIn","UI/UX Designers & Founders"],
 ["Elena Petrova","Founder","Bloom Realty","Real Estate","Berlin, Germany","High",86,"Property listings are hard to browse and enquire.","Real estate website redesign","Listings are cluttered; enquiry form is hidden","Urgent — new listings launching","LinkedIn","Startup Founders — SaaS"],
 ["James Carter","Owner","Carter Fitness Co.","Fitness","Toronto, Canada","Medium",74,"Our site does not sell memberships online.","Landing page for memberships","No clear CTA; class timetable is hard to read","Soon","LinkedIn","Small Business Owners"],
 ["Priya Nair","Marketing Head","EduSpark","Education","Mumbai, India","High",89,"Course pages have high bounce and low enrolments.","Course landing pages + checkout UX","Bounce is high; enrolment flow has 5 steps","Hiring now","LinkedIn","eCommerce Business Owners"],
 ["Lucas Meyer","CEO","LogiTrack","Logistics","Amsterdam, Netherlands","Medium",78,"Customers cannot track shipments easily.","Customer portal UI redesign","Tracking is buried; status updates are unclear","Exploring","LinkedIn","Startup Founders — SaaS"],
 ["Hannah Kim","Founder","Glow Skincare","eCommerce","Seoul, South Korea","High",91,"Our product pages do not convert Instagram traffic.","Product page + mobile UX redesign","Mobile product pages are slow; reviews are hidden","ASAP","LinkedIn","eCommerce Business Owners"],
 ["David Osei","Co-Founder","AgriSense","AgriTech","Nairobi, Kenya","Low",65,"We need a simple site to explain our product to farmers.","New marketing website","No website yet; message is unclear","Exploring — early stage","LinkedIn","Startup Founders — SaaS"],
 // Facebook — 10
 ["Rahim Uddin","Owner","Dhaka Bites Restaurant","Food & Hospitality","Dhaka, Bangladesh","High",84,"Customers cannot order online easily.","Restaurant website + online ordering UX","Menu is a PDF; ordering needs a phone call","Urgent — Ramadan menu launch","Facebook","Small Business Owners — Website Help"],
 ["Maria Gonzalez","Founder","Casa Verde Interiors","Interior Design","Austin, USA","High",87,"Our portfolio does not win enquiries.","Portfolio website redesign","Portfolio is slow; contact form is buried","Hiring this month","Facebook","Startup Founders & Entrepreneurs"],
 ["Khalid Al Mansoori","CEO","Desert Rose Travel","Travel","Dubai, UAE","Medium",79,"Tour booking drops off on mobile.","Travel booking website redesign","Mobile booking is 4 screens; prices are unclear","Soon","Facebook","eCommerce Sellers"],
 ["Nusrat Jahan","Owner","Nusrat Boutique","Fashion","Chattogram, Bangladesh","High",83,"Instagram shoppers do not complete orders on our site.","eCommerce UX + Instagram shop flow","Checkout is confusing; sizes are unclear","ASAP","Facebook","eCommerce Sellers — Shopify"],
 ["Tom Becker","Founder","Becker Legal","Legal","Chicago, USA","Medium",72,"Our site looks like it is from 2012 and clients notice.","Law firm website redesign","Outdated trust signals; no clear practice areas","Exploring","Facebook","Small Business Owners — Website Help"],
 ["Anika Sharma","Co-Founder","PetPals","Pets","Delhi, India","High",88,"Pet owners abandon the adoption form.","Adoption flow + landing page","Form is 12 fields; no progress indicator","Hiring now","Facebook","Startup Founders & Entrepreneurs"],
 ["Yusuf Ali","Owner","Ali Auto Parts","Automotive","Jeddah, Saudi Arabia","Low",62,"We need a catalogue customers can search.","Product catalogue website","No online catalogue; orders by WhatsApp only","Exploring","Facebook","Small Business Owners — Website Help"],
 ["Clara Dubois","CEO","Atelier Clara","Fashion","Paris, France","High",90,"Our lookbook does not convert to sales.","Lookbook + eCommerce redesign","Lookbook has no buy links; mobile is slow","Urgent — new collection","Facebook","eCommerce Sellers"],
 ["Ben Thompson","Founder","Thompson Coaching","Coaching","Sydney, Australia","Medium",76,"Visitors do not book a discovery call.","Coaching landing page","CTA is below the fold; testimonials are hidden","Soon","Facebook","Startup Founders & Entrepreneurs"],
 ["Fatima Noor","Owner","Noor Jewels","Jewellery","Lahore, Pakistan","High",85,"Our site is beautiful but sales are low.","Jewellery eCommerce UX audit + redesign","Checkout friction; no trust badges; slow images","ASAP","Facebook","eCommerce Sellers — Shopify"],
 // Upwork — 3
 ["Upwork Client — SaaS Onboarding","Product Manager","Upwork Job: SaaS Onboarding","SaaS","Remote","High",93,"Need a designer to redesign our onboarding in Figma.","SaaS onboarding UX (Figma)","Onboarding drop-off 68%; users miss key steps","Budget $2,500 — hiring now","Upwork","Upwork — UI/UX Jobs"],
 ["Upwork Client — Shopify Redesign","Store Owner","Upwork Job: Shopify Redesign","eCommerce","Remote","High",89,"Need a full Shopify redesign before Black Friday.","Shopify redesign","Conversion 0.8%; theme is outdated","Budget $3,000 — ASAP","Upwork","Upwork — UI/UX Jobs"],
 ["Upwork Client — Mobile App","Startup Founder","Upwork Job: Finance App UI","FinTech","Remote","Medium",80,"Need 12 screens for a finance app.","Mobile app UI in Figma","No design system; screens are inconsistent","Budget $1,800 — soon","Upwork","Upwork — UI/UX Jobs"],
 // Reddit — 3
 ["Reddit — r/startups Founder","Founder","Stealth Startup (Reddit)","SaaS","Remote","Medium",77,"Our landing page gets traffic but no signups.","Landing page critique + redesign","Hero is vague; no social proof; CTA is weak","Exploring","Reddit","r/startups"],
 ["Reddit — r/forhire Client","Business Owner","Local Gym Chain (Reddit)","Fitness","Remote","High",82,"Looking for a designer for our new website.","New website design","Old site is not mobile-friendly","Hiring now","Reddit","r/forhire"],
 ["Reddit — r/web_design Poster","Owner","Online Course (Reddit)","Education","Remote","Low",68,"Our course site feels cluttered.","Course website UX audit","Too many colours; navigation is confusing","Exploring","Reddit","r/web_design"],
];
function makeLead(r,i){
  const [name,role,company,industry,location,intent,match,want,looking,problems,urgency,source,group]=r;
  return {id:i+1,name,role,company,industry,location,intent,match,website:"",email:"",phone:"",want,lookingFor:looking,problems:problems.split(";").map(s=>s.trim()),urgency,source,group,postDate:"2026-11-24",status:"New",notes:"",sample:true,audit:null,
  linkedinUrl:"",facebookUrl:"",upworkUrl:"",redditUrl:"",xUrl:"",behanceUrl:"",dribbbleUrl:"",
  outreach:`Hi ${name.split(" ")[0]}, I saw your post about ${want.toLowerCase()} I help ${industry.toLowerCase()} brands fix exactly that — starting with a quick UX audit. Want me to share the top 3 fixes for ${company}?`};
}
// Sanitize any lead object (loaded from localStorage, CSV, or a form) so a corrupt
// or hostile record can never break a view or inject HTML. Returns the lead.
function sanitize(l){
  if(!l || typeof l !== "object") return null;
  const s = (v)=> (v === null || v === undefined) ? "" : String(v);
  l.name = s(l.name) || "Unnamed lead";
  l.role = s(l.role); l.company = s(l.company); l.industry = s(l.industry) || "—";
  l.location = s(l.location); l.intent = ["High","Medium","Low"].indexOf(l.intent) !== -1 ? l.intent : "Medium";
  l.match = Number.isFinite(+l.match) ? Math.max(0, Math.min(100, Math.round(+l.match))) : 50;
  l.want = s(l.want); l.lookingFor = s(l.lookingFor || l.want);
  l.problems = Array.isArray(l.problems) ? l.problems.filter(x=>x !== null && x !== undefined).map(x=>String(x)) : (l.problems ? [String(l.problems)] : []);
  l.urgency = s(l.urgency); l.source = s(l.source) || "Web Search"; l.group = s(l.group);
  l.postDate = s(l.postDate); l.status = s(l.status) || "New"; l.notes = s(l.notes);
  l.sample = !!l.sample;
  if(!isRealUrl(l.website)) l.website = "";
  ["linkedinUrl","facebookUrl","upworkUrl","redditUrl","xUrl","behanceUrl","dribbbleUrl"].forEach(k=>{ if(l[k] && !isRealUrl(l[k])) l[k] = ""; });
  l.email = s(l.email); l.phone = s(l.phone);
  if(l.audit){
    const a = l.audit;
    if(typeof a !== "object" || !Number.isFinite(+a.score) || !Array.isArray(a.top) || !Array.isArray(a.wins)) l.audit = null;
    else { a.score = Math.max(0, Math.min(100, Math.round(+a.score))); a.top = a.top.map(String); a.wins = a.wins.map(String); a.method = String(a.method || "Local pre-check (text-based)"); }
  }
  if(!l.outreach) l.outreach = "";
  return l;
}

// ---------- State ----------
let leads = [];
try{ leads = JSON.parse(localStorage.getItem("leadgen_leads")||"null") || SAMPLE.map(makeLead); }catch(e){ leads = SAMPLE.map(makeLead); }
leads = leads.map(sanitize).filter(Boolean);
function save(){ try{ localStorage.setItem("leadgen_leads", JSON.stringify(leads)); }catch(e){} }
let settings = {};
try{ settings = JSON.parse(localStorage.getItem("leadgen_settings")||"{}"); }catch(e){ settings = {}; }
settings.linkedin = settings.linkedin || "https://www.linkedin.com/groups/13929983/\nhttps://www.linkedin.com/groups/8437680/\nhttps://www.linkedin.com/groups/3704356/\nhttps://www.linkedin.com/groups/14201336/";
settings.facebook = settings.facebook || "https://www.facebook.com/groups/766025753165133/\nhttps://www.facebook.com/groups/needwebsitedesignerordeveloper/\nhttps://www.facebook.com/groups/383105463976379/\nhttps://www.facebook.com/groups/752790164383176/\nhttps://www.facebook.com/groups/903983456080142/\nhttps://www.facebook.com/groups/findwebdeveloperbd/\nhttps://www.facebook.com/groups/1518732269130112/";
settings.keywords = settings.keywords || "looking for UI UX designer, need website redesign, need landing page, hiring designer, website looks outdated, need Figma designer, need product designer";
settings.target = (settings.target === undefined || settings.target === null) ? 20 : settings.target; // honest free daily target: 10-20 researched leads/day, not 100/source/day
settings.time = settings.time || "09:00 Asia/Dhaka";
settings.offer = settings.offer || "a free homepage mockup so you can see the direction before paying anything";
settings.tone = settings.tone || "Confident & direct";
settings.senderName = settings.senderName || "Mahmudur Rashid";
settings.signature = settings.signature || "Mahmudur Rashid, Product Designer (UI/UX) · Sylhet, Bangladesh\nPhone +880 1877532642 · mahmudurrashid.design@gmail.com\nPortfolio: https://mahmudur-rashid-website.vercel.app";
settings.demoMode = (settings.demoMode === undefined) ? true : !!settings.demoMode; // Demo mode ON = SAMPLE data visible, clearly labelled; OFF = real data only
function saveSettings(){ try{ localStorage.setItem("leadgen_settings", JSON.stringify(settings)); }catch(e){} }

// Sample counts / visibility — sample data is NEVER mixed into production analytics.
// visibleLeads() is the only list views and counts use. Real leads = leads.filter(!sample).
function realLeads(){ return leads.filter(l=>!l.sample); }
function visibleLeads(){ return settings.demoMode ? leads : realLeads(); }
function sampleCounts(){
  return {
    leads: leads.filter(l=>l.sample).length,
    maps: mapsBusinesses.filter(b=>b.sample).length,
    fb: fbBusinesses.filter(b=>b.sample).length,
  };
}
function visibleMaps(){ return settings.demoMode ? mapsBusinesses : mapsBusinesses.filter(b=>!b.sample); }
function visibleFb(){ return settings.demoMode ? fbBusinesses : fbBusinesses.filter(b=>!b.sample); }

// ---------- Google Maps — SAMPLE no-website businesses (one per country, clearly labelled) ----------
const MAPS_SAMPLE = [
  {name:"The Velvet Cut", category:"Salon", city:"London", country:"UK", phone:"Not available", rating:"Not available"},
  {name:"Brooklyn Smile Dental", category:"Dentist", city:"New York", country:"USA", phone:"Not available", rating:"Not available"},
  {name:"Maple Leaf Café", category:"Cafe", city:"Toronto", country:"Canada", phone:"Not available", rating:"Not available"},
  {name:"Bondi Fit Studio", category:"Gym", city:"Sydney", country:"Australia", phone:"Not available", rating:"Not available"},
  {name:"Kreuzberg Kitchen", category:"Restaurant", city:"Berlin", country:"Germany", phone:"Not available", rating:"Not available"},
  {name:"Atelier Lumière", category:"Beauty studio", city:"Paris", country:"France", phone:"Not available", rating:"Not available"},
  {name:"Clinique du Parc", category:"Clinic", city:"Luxembourg City", country:"Luxembourg", phone:"Not available", rating:"Not available"},
  {name:"Harbour Fix Plumbing", category:"Plumber", city:"Singapore", country:"Singapore", phone:"Not available", rating:"Not available"},
];
const MAPS_COUNTRIES = ["USA","UK","Canada","Australia","Germany","France","Luxembourg","Singapore"];
let mapsBusinesses = [];
try{ mapsBusinesses = JSON.parse(localStorage.getItem("leadgen_maps")||"null") || MAPS_SAMPLE.map((b,i)=>({...b, id:i+1, sample:true})); }catch(e){ mapsBusinesses = MAPS_SAMPLE.map((b,i)=>({...b, id:i+1, sample:true})); }
function saveMaps(){ try{ localStorage.setItem("leadgen_maps", JSON.stringify(mapsBusinesses)); }catch(e){} }
function mapsLinkFor(b){ return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(b.name + " " + b.city); }

// ---------- Facebook Businesses — SAMPLE (one or two per country, clearly labelled) ----------
// Page links point to well-known public Facebook pages that actually load.
// A sample business with no real page of its own links to its Facebook search page instead.
// Never invent a fake facebook.com/username for a fictional business.
const FB_COUNTRIES = ["USA","UK","Canada","Australia","Germany","France","Luxembourg","Singapore"];
const FB_SAMPLE = [
  {name:"Starbucks", category:"Coffee shop", city:"Seattle", country:"USA", phone:"Not available", page:"https://www.facebook.com/Starbucks"},
  {name:"McDonald's", category:"Restaurant", city:"Chicago", country:"USA", phone:"Not available", page:"https://www.facebook.com/McDonaldsUS"},
  {name:"Costa Coffee", category:"Coffee shop", city:"London", country:"UK", phone:"Not available", page:"https://www.facebook.com/costa"},
  {name:"Tesco", category:"Supermarket", city:"Welwyn Garden City", country:"UK", phone:"Not available", page:"https://www.facebook.com/Tesco"},
  {name:"Tim Hortons", category:"Coffee shop", city:"Toronto", country:"Canada", phone:"Not available", page:"https://www.facebook.com/TimHortons"},
  {name:"Lululemon", category:"Athletic apparel", city:"Vancouver", country:"Canada", phone:"Not available", page:"https://www.facebook.com/lululemon"},
  {name:"Woolworths", category:"Supermarket", city:"Sydney", country:"Australia", phone:"Not available", page:"https://www.facebook.com/woolworths"},
  {name:"Bunnings Warehouse", category:"Hardware store", city:"Melbourne", country:"Australia", phone:"Not available", page:"https://www.facebook.com/Bunnings"},
  {name:"adidas", category:"Sportswear", city:"Herzogenaurach", country:"Germany", phone:"Not available", page:"https://www.facebook.com/adidas"},
  {name:"Lidl Deutschland", category:"Supermarket", city:"Neckarsulm", country:"Germany", phone:"Not available", page:"https://www.facebook.com/lidl.de"},
  {name:"Decathlon France", category:"Sporting goods", city:"Villeneuve-d'Ascq", country:"France", phone:"Not available", page:"https://www.facebook.com/DecathlonFrance"},
  {name:"Carrefour", category:"Supermarket", city:"Massy", country:"France", phone:"Not available", page:"https://www.facebook.com/carrefourfrance"},
  {name:"Cactus", category:"Supermarket", city:"Windhof", country:"Luxembourg", phone:"Not available", page:"https://www.facebook.com/cactus.lu"},
  {name:"BGL BNP Paribas", category:"Bank", city:"Luxembourg City", country:"Luxembourg", phone:"Not available", page:"https://www.facebook.com/BGLBNPParibas"},
  {name:"Singapore Airlines", category:"Airline", city:"Singapore", country:"Singapore", phone:"Not available", page:"https://www.facebook.com/singaporeair"},
  {name:"DBS Bank", category:"Bank", city:"Singapore", country:"Singapore", phone:"Not available", page:"https://www.facebook.com/dbs"},
];
let fbBusinesses = [];
try{ fbBusinesses = JSON.parse(localStorage.getItem("leadgen_fb")||"null") || FB_SAMPLE.map((b,i)=>({...b, id:i+1, sample:true})); }catch(e){ fbBusinesses = FB_SAMPLE.map((b,i)=>({...b, id:i+1, sample:true})); }
function saveFb(){ try{ localStorage.setItem("leadgen_fb", JSON.stringify(fbBusinesses)); }catch(e){} }
function fbPageLink(b){
  if(isRealUrl(b.page)) return b.page;
  return fbSearchLink(b.name);
}

// ---------- Website audits (real, user-run — stored, listed in Audits view) ----------
// An audit is a LOCAL pre-check: it scores only facts in the lead record (has a site,
// has an email/phone, problems documented, clear want). It is NOT a Lighthouse /
// PageSpeed audit — the static file has no browser engine or API key. The method is
// printed on every audit so the score is never mistaken for a Lighthouse score.
// For a full free audit, use PageSpeed Insights (free key, 25k/day) — see README.
let audits = [];
try{ audits = JSON.parse(localStorage.getItem("leadgen_audits")||"[]"); if(!Array.isArray(audits)) audits = []; }catch(e){ audits = []; }
audits = audits.filter(a=>a && typeof a === "object" && a.company && Number.isFinite(+a.score));
function saveAudits(){ try{ localStorage.setItem("leadgen_audits", JSON.stringify(audits)); }catch(e){} }
function runAudit(l){
  if(!isRealUrl(l.website)) return null;
  const problems = [];
  const wins = [];
  let score = 30; // base: a site exists at all
  if(l.email){ score += 10; } else { problems.push("No public email listed — visitors cannot contact the business by email."); wins.push("Add a public business email or a contact form so enquiries do not depend on a phone call."); }
  if(l.phone){ score += 5; } else { problems.push("No phone number shown on the lead record — check whether the site shows one."); wins.push("Show a phone number in the header so visitors can call without hunting for it."); }
  if(l.want){ score += 10; } else { problems.push("No clear service description was found for this business."); wins.push("Write one clear sentence on the homepage saying what you do and who it is for."); }
  (l.problems||[]).forEach(p=>{ problems.push(p); score -= 4; });
  if(problems.length === 0){ problems.push("No specific problems were documented for this site yet — run a full PageSpeed Insights audit for performance, accessibility and SEO."); wins.push("Run the free PageSpeed Insights audit (see README) for a full performance, accessibility and SEO report."); }
  if(l.intent === "High") score += 5;
  score = Math.max(20, Math.min(95, score));
  const audit = {id: nextId(audits), leadId: l.id, company: l.company, url: l.website,
    score: score, date: new Date().toISOString().slice(0,10),
    method: "Local pre-check (text-based) — NOT a Lighthouse/PageSpeed audit",
    top: problems.slice(0,5), wins: wins.slice(0,3)};
  audits = audits.filter(a=>String(a.leadId) !== String(l.id));
  audits.unshift(audit);
  l.audit = audit;
  saveAudits(); save();
  logEvent("Audits", "Website pre-check run for " + l.company + " — score " + score + "/100", 1);
  return audit;
}

// ---------- Collection log (real, persisted — every import/add/search/audit appends) ----------
let runLog = [];
try{ runLog = JSON.parse(localStorage.getItem("leadgen_log")||"null"); if(!Array.isArray(runLog)) runLog = null; }catch(e){ runLog = null; }
if(!runLog){
  runLog = [
    {date:"2026-11-26 09:00", source:"Google Maps", result:"Hosted dashboard history — new no-website businesses saved", count:8},
    {date:"2026-11-26 09:00", source:"Upwork", result:"Hosted dashboard history — 3 leads found in test run", count:3},
    {date:"2026-11-25 09:45", source:"Pitch Studio", result:"Hosted dashboard history — pitch sweep, drafts written for pitched leads", count:7},
    {date:"2026-11-25 09:30", source:"Job Hub", result:"Hosted dashboard history — Gmail read-only refresh", count:36},
    {date:"2026-11-24 09:00", source:"LinkedIn", result:"Hosted dashboard history — needs connection, login-walled, no group-monitoring API", count:0},
    {date:"2026-11-24 09:00", source:"Facebook", result:"Hosted dashboard history — needs connection, login-walled, no group-monitoring API", count:0},
  ];
}
function saveLog(){ try{ localStorage.setItem("leadgen_log", JSON.stringify(runLog)); }catch(e){} }
function logEvent(source, result, count){
  const d = new Date();
  const stamp = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") + " " + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
  runLog.unshift({date: stamp, source: source, result: result, count: count || 0});
  if(runLog.length > 200) runLog = runLog.slice(0, 200);
  saveLog();
}

// ---------- Job Hub (Gmail work as of 25 Nov 2026, read-only snapshot) ----------
const JOB_HUB = {
  followups: [
    {to:"Shakil — mdshakilmirja701@gmail.com", role:"Project-based UI/UX Designer", date:"22 Nov 2026", state:"Sent ~02:40, 25 Nov"},
    {to:"NaxtBrand — hr@naxtbrand.com", role:"Product / UI/UX Designer", date:"17 Nov 2026", state:"Sent ~02:40, 25 Nov"},
    {to:"Psyminimal — contact@psymnl.com", role:"UI/UX Designer", date:"17 Nov 2026", state:"Sent ~02:40, 25 Nov"},
    {to:"geekssort — careers@geekssort.com", role:"UI/UX Designer", date:"16 Nov 2026", state:"Sent ~02:40, 25 Nov"},
    {to:"Avanti Salon, Boston — avantisalonboston@gmail.com", role:"Website redesign", date:"22 Nov 2026", state:"Sent ~02:40, 25 Nov"},
    {to:"mkopcz — mkopcz@yahoo.com", role:"Design support", date:"17 Nov 2026", state:"Sent ~02:40, 25 Nov"},
  ],
  applications: [
    ["22 Nov","Shakil","Project-based UI/UX Designer","No reply yet"],
    ["19 Nov","Baunfire","Junior Visual Designer","No reply yet"],
    ["17 Nov","NaxtBrand","Product / UI/UX Designer","No reply yet"],
    ["17 Nov","Psyminimal","UI/UX Designer","No reply yet"],
    ["16 Nov","geekssort","UI/UX Designer","No reply yet"],
    ["15 Nov","Phil Careers","UI/UX Designer","No reply yet"],
    ["13 Nov","Amazin Apps","UI/UX Designer","No reply yet"],
    ["12 Nov","DextroDevs","UI/UX Designer (project)","No reply yet"],
    ["12 Nov","Resilio Partners","Remote UI/UX Reviewer","No reply yet"],
    ["9 Nov","CodeItDevs","UI/UX Designer","No reply yet"],
  ],
  matches: [
    ["Metabase","Product Designer","Remote · $93k–$210k","Haystack, 23 Nov"],
    ["Raydar","Senior Product Designer","Remote US · $170k–$250k","Haystack, 25 Nov"],
    ["Tessera Labs","Senior Product Designer","Remote US · $179k–$230k","Haystack, 25 Nov"],
    ["Popl","Senior Product Designer","Remote US · $140k–$180k","Haystack, 25 Nov"],
    ["24x7Customer.com","Mobile / Responsive UI/UX Designer","Remote, US","Glassdoor, 24 Nov"],
    ["CobaltLane","UX Designer","Creative Studio","Glassdoor, 24 Nov"],
  ],
  replies: [{from:"Bask Health (via Workable)", text:"Junior UX Designer — application confirmation, 22 Nov 2026. No interview invitation in the last 7 days as of 24 Nov."}],
  noise: [["Glassdoor",14,"Same CobaltLane and 24x7Customer.com roles repeated daily"],["Haystack",6,"Daily job streams"],["Intch",2,"Repeated alerts"]],
};

// ---------- Pitch Library — senior pitch templates ----------
const PITCH_TEMPLATES = [
  {name:"No website — first-website pitch", subject:"Your customers find you on Google — but then what?",
   body:"Hi {{name}},\n\nI found {{company}} on Google Maps and noticed there is no website linked — and no rating shown.\n\nThat means someone who finds you has nowhere to see your services or prices, and no way to book online. Their only next step is calling, and a business with a website is easier to choose.\n\nA first website would give them a services & prices page, online booking, and a clear page showing your location. I can start with {{offer}}.\n\nWould a 15-minute call this week work?\n\n{{signature}}"},
  {name:"Has a website — redesign pitch", subject:"3 things on your website are costing you clients",
   body:"Hi {{name}},\n\nI reviewed {{company}}'s website and found three problems that are likely costing you enquiries:\n\n1. {{problem1}}\n2. {{problem2}}\n3. {{problem3}}\n\nEach one has a quick fix — and together they are why visitors leave without contacting you. I design website redesigns that fix exactly these problems, starting with {{offer}}.\n\nWould a 15-minute call this week work?\n\n{{signature}}"},
];
const FOLLOWUP_TEMPLATE = "Hi {{name}}, just checking in — I saw your post about {{want}} Shall I send over the top 3 fixes for {{company}}? No pressure if the timing is not right.";

// ---------- DOM helpers ----------
// esc() escapes & < > " ' and ` — EVERY user/imported value goes through it at render time.
// The old version did not escape ' and interpolated intent raw in three places (stored-XSS).
const $ = s => (typeof document !== "undefined" ? document.querySelector(s) : null);
const $$ = s => (typeof document !== "undefined" ? Array.from(document.querySelectorAll(s)) : []);
const initials = n => String(n||"").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
const esc = s => String(s??"").replace(/[&<>"'`]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","`":"&#96;"}[c]));
function copyText(text, btn){
  const done=()=>{ if(!btn) return; const old=btn.textContent; btn.textContent="Copied ✓"; btn.disabled=true; setTimeout(()=>{ btn.textContent=old; btn.disabled=false; },1500); };
  const fallback=()=>{ const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); done(); }catch(e){ alert("Copy failed — please select the text manually."); } document.body.removeChild(ta); };
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(done).catch(fallback); }
  else fallback();
}
function fill(tpl, l){
  return String(tpl).replace(/\{\{(\w+)\}\}/g, (m,k)=>{
    if(k==="name") return (l.name||"there").split(" ")[0];
    if(k==="company") return l.company || "your business";
    if(k==="want") return String(l.want||"a new website").toLowerCase();
    if(k==="problem1") return (l.problems && l.problems[0]) || "the hero does not explain what you do";
    if(k==="problem2") return (l.problems && l.problems[1]) || "the call to action is hard to find";
    if(k==="problem3") return (l.problems && l.problems[2]) || "the site is hard to use on mobile";
    if(k==="offer") return settings.offer || "a free homepage mockup so you can see the direction before paying anything";
    if(k==="signature") return settings.signature || "Mahmudur Rashid, Product Designer (UI/UX)";
    return "";
  });
}
// Every lead gets a complete outreach draft — including Add-Lead and CSV-imported leads,
// which used to get a truncated sentence or nothing at all (and so never reached Review Queue).
function generateOutreach(l){
  const tpl = isRealUrl(l.website) ? PITCH_TEMPLATES[1].body : PITCH_TEMPLATES[0].body;
  return fill(tpl, l);
}
function followupFor(l){ return fill(FOLLOWUP_TEMPLATE, l); }
function subjectFor(l){ return l.website ? "3 things on your website are costing you clients" : "Your customers find you on Google — but then what?"; }
function fullEmailFor(l){
  if(!l.outreach) return "";
  return "Subject: " + subjectFor(l) + "\n\n" + l.outreach + "\n\n—\n" + (settings.signature || "Mahmudur Rashid, Product Designer (UI/UX)");
}
function fixesTextFor(l){
  if(!l.audit) return "Website check for " + l.company + " — no website to check.\nHow you can fix it: build a first website with a clear services page, contact/enquiry and booking information, and a professional online presence, so Maps and search visitors have somewhere to go next.";
  return "Website check for " + l.company + " — score " + l.audit.score + "/100 (" + l.audit.method + ")\nProblems:\n- " + l.audit.top.join("\n- ") + "\nHow you can fix them:\n- " + l.audit.wins.join("\n- ");
}
function linksRow(l){
  const links = [];
  if(isRealUrl(l.website)) links.push('<a href="' + esc(l.website) + '" target="_blank" rel="noopener">Website ↗</a>');
  links.push('<a href="' + esc(mapsLink(l)) + '" target="_blank" rel="noopener">Google Maps ↗</a>');
  const p = platformLink(l);
  if(p.url !== mapsLink(l)) links.push('<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.label) + ' ↗</a>');
  storedLinks(l).forEach(s=>links.push('<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + ' ↗</a>'));
  return '<div class="lead-cat"><h4>Links</h4><p class="links">' + links.join(" · ") + '</p></div>';
}
function linksDetail(l){
  const rows = [];
  rows.push(["Website", isRealUrl(l.website) ? '<a href="' + esc(l.website) + '" target="_blank" rel="noopener">' + esc(l.website) + '</a>' : "No website"]);
  rows.push(["Google Maps", '<a href="' + esc(mapsLink(l)) + '" target="_blank" rel="noopener">Search “' + esc(l.company) + '” on Google Maps</a>']);
  const p = platformLink(l);
  rows.push([l.source, '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.label) + '</a>']);
  const stored = storedLinks(l);
  ["LinkedIn profile","Facebook","Upwork","Reddit post","X","Behance","Dribbble"].forEach(label=>{
    const hit = stored.find(s=>s.label===label);
    rows.push([label, hit ? '<a href="' + esc(hit.url) + '" target="_blank" rel="noopener">' + esc(hit.url) + '</a>' : '<span class="muted">Not available</span>']);
  });
  return rows.map(([k,v])=>'<dt>' + esc(k) + '</dt><dd>' + v + '</dd>').join("");
}

// ---------- Proper CSV parsing (the old naive split(",") mangled any quoted comma) ----------
// Handles: quoted fields with commas, escaped "" quotes, \r\n line endings, blank lines.
// Returns {rows: [ {headerName: value} ], errors: [strings]}. Header row is required
// and must contain a "name" column; columns are matched by header name, not position.
function parseCSV(text){
  const rows = [];
  let row = [], field = "", inQuotes = false;
  const src = String(text||"").replace(/^\uFEFF/, "");
  for(let i=0;i<src.length;i++){
    const c = src[i];
    if(inQuotes){
      if(c === '"'){
        if(src[i+1] === '"'){ field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if(c === '"'){ inQuotes = true; }
    else if(c === ","){ row.push(field); field = ""; }
    else if(c === "\r"){ /* ignore, \n ends the row */ }
    else if(c === "\n"){ row.push(field); field = ""; rows.push(row); row = []; }
    else field += c;
  }
  if(field !== "" || row.length){ row.push(field); rows.push(row); }
  const clean = rows.filter(r=>r.some(v=>String(v).trim() !== ""));
  if(!clean.length) return {rows:[], errors:["The file is empty."]};
  const headers = clean[0].map(h=>String(h).trim().toLowerCase().replace(/[^a-z0-9]/g,""));
  if(headers.indexOf("name") === -1) return {rows:[], errors:["No 'name' column found. First row must be a header with at least: name. Expected columns: name, role, company, website, email, source, intent, industry, location, want."]};
  const out = [];
  for(let i=1;i<clean.length;i++){
    const obj = {};
    clean[i].forEach((v,j)=>{ if(headers[j]) obj[headers[j]] = String(v).trim(); });
    out.push(obj);
  }
  return {rows: out, errors: []};
}
function csvEscape(v){
  const s = String(v??"");
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
}

// ---------- Navigation ----------
const VIEWS = [
  {section:"Main", items:[
    {id:"overview", label:"Overview", ico:"▦"},
    {id:"leads", label:"All Leads", ico:"▤"},
    {id:"companies", label:"Companies", ico:"▦"},
    {id:"audits", label:"Audits", ico:"✓"},
    {id:"log", label:"Collection Log", ico:"≡"},
  ]},
  {section:"Outreach", items:[
    {id:"review", label:"Review Queue", ico:"✉"},
    {id:"pitch", label:"Pitch Studio", ico:"✎"},
    {id:"jobhub", label:"Job Hub", ico:"⌘"},
  ]},
  {section:"No-website businesses", items:[
    {id:"maps", label:"Google Maps", ico:"◎"},
    {id:"fb", label:"Facebook Businesses", ico:"f"},
  ]},
  {section:"Help & settings", items:[
    {id:"guide", label:"Guide", ico:"?"},
    {id:"settings", label:"Settings", ico:"⚙"},
  ]},
];
const VIEW_TITLES = {overview:["Overview","Your leads, audits and drafts at a glance. Demo data is counted separately — see the banner."],leads:["All Leads","Every lead, by source. Open a card for the full detail, audit and draft."],companies:["Companies","Leads grouped by company."],audits:["Audits","Website UI/UX checks — score, problems and how to fix them. Run a check from any lead with a website."],log:["Collection Log","Daily collection runs and what they found — every import, add and audit is logged here."],review:["Review Queue","Drafts waiting for you to copy and send. Nothing is sent automatically."],pitch:["Pitch Studio","Senior pitch templates and every draft, ready to copy."],jobhub:["Job Hub","Job applications, follow-ups, matches and replies from Gmail (read-only snapshot, 25 Nov 2026)."],maps:["Google Maps — No Website","Businesses with no website in 8 countries. Pitch them a first website."],fb:["Facebook Businesses","New businesses found on Facebook in the same 8 countries as Google Maps."],guide:["Guide","How this dashboard works, step by step."],settings:["Settings","Groups, keywords, pages watched and appearance. Saved in your browser."]};
let currentView = "overview";
let currentTab = ""; // "" = All leads, otherwise a source name, "__drafts" = Drafts to copy
let currentFbCountry = "USA";
let currentMapsCountry = "";
let statusFilter = "";
let intentFilter = "";
let sortBy = "newest";

function counts(list){ const c={}; (list||visibleLeads()).forEach(l=>c[l.source]=(c[l.source]||0)+1); return c; }
function setTheme(next){
  document.documentElement.setAttribute("data-theme", next);
  try{ localStorage.setItem("leadgen_theme", next); }catch(e){}
  paintThemeBtns();
}
function paintThemeBtns(){
  const dark = document.documentElement.getAttribute("data-theme")==="amoled";
  ["#themeBtn","#themeBtnSide"].forEach(sel=>{ const b=$(sel); if(b) b.textContent = dark ? "Light" : "AMOLED"; });
}
function renderNav(){
  const el = $("#sideNav"); if(!el) return;
  const list = visibleLeads();
  const c = counts(list);
  const reviewCount = list.filter(l=>l.outreach && !l.email).length;
  el.innerHTML = VIEWS.map(sec=>'<div class="nav-section">' + sec.section + '</div>' + sec.items.map(it=>{
    let n = "";
    if(it.id==="leads") n = list.length;
    if(it.id==="review") n = reviewCount;
    if(it.id==="maps") n = visibleMaps().length;
    if(it.id==="fb") n = visibleFb().length;
    if(it.id==="audits") n = audits.length;
    return '<button type="button" class="nav-item' + (currentView===it.id?" active":"") + '" data-view="' + it.id + '"><span class="ico">' + it.ico + '</span>' + esc(it.label) + (n!==""?'<span class="cnt">' + n + '</span>':"") + '</button>';
  }).join("")).join("");
  el.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{ go(b.dataset.view); }));
}
function go(view){
  currentView = view;
  const t = VIEW_TITLES[view] || ["Dashboard",""];
  $("#viewTitle").textContent = t[0];
  $("#viewSubtitle").textContent = t[1];
  $("#sidebar").classList.remove("open");
  $("#scrim").classList.add("hidden");
  render();
}
function paintBanner(){
  const b = $("#sampleBanner"); if(!b) return;
  const sc = sampleCounts();
  const total = sc.leads + sc.maps + sc.fb;
  if(total === 0){ b.classList.add("hidden"); return; }
  b.classList.remove("hidden");
  b.querySelector("div").innerHTML = "<strong>SAMPLE DATA — DEMO ONLY.</strong> "
    + "This file ships with " + sc.leads + " sample leads, " + sc.maps + " sample Maps businesses and " + sc.fb + " sample Facebook businesses — clearly-labelled fictional examples to test the layout. They are <b>not real people</b> and their emails are not real. "
    + (settings.demoMode ? "Demo mode is <b>ON</b>: sample data is shown and counted separately from your real leads. Turn Demo mode off in Settings (or below) to see real data only." : "Demo mode is <b>OFF</b>: sample data is hidden. Turn it on to see the examples again.")
    + ' <button class="btn small" id="demoToggleBtn" type="button">' + (settings.demoMode ? "Turn Demo mode OFF" : "Turn Demo mode ON") + '</button>';
  const dt = $("#demoToggleBtn");
  if(dt) dt.addEventListener("click", ()=>{ settings.demoMode = !settings.demoMode; saveSettings(); render(); });
}
function render(){
  if(typeof document === "undefined") return;
  renderNav();
  paintBanner();
  const root = $("#viewRoot"); if(!root) return;
  const fn = {overview:viewOverview, leads:viewLeads, companies:viewCompanies, audits:viewAudits, log:viewLog, review:viewReview, pitch:viewPitch, jobhub:viewJobHub, maps:viewMaps, fb:viewFb, guide:viewGuide, settings:viewSettings}[currentView] || viewOverview;
  root.innerHTML = fn();
  bindView();
  const list = visibleLeads();
  const foot = $("#footStats");
  if(foot) foot.textContent = " · " + list.length + " leads shown (" + realLeads().length + " real, " + sampleCounts().leads + " sample) · " + list.filter(l=>l.outreach).length + " drafts ready · " + list.filter(l=>l.email).length + " with email";
}

// ---------- Overview ----------
function viewOverview(){
  const list = visibleLeads();
  const real = realLeads();
  const c = counts(list);
  const high = list.filter(l=>l.intent==="High").length;
  const withEmail = list.filter(l=>l.email).length;
  const withSite = list.filter(l=>l.website).length;
  const drafted = list.filter(l=>l.outreach).length;
  const funnel = [["New","New"],["Contacted","Contacted"],["Replied","Replied"],["Qualified","Qualified"],["Proposal Sent","Proposal Sent"],["Won","Won"],["Lost","Lost"],["Not Interested","Not Interested"]].map(([k])=>[k, list.filter(l=>l.status===k).length]);
  const sources = ["LinkedIn","Facebook","Upwork","Reddit","X","Indie Hackers","Clutch","Web Search","Google Maps"];
  return '<div class="grid stats">'
    + statCard(list.length,"Total leads shown", real.length + " real · " + sampleCounts().leads + " sample")
    + statCard(high,"High-intent leads", Math.round(high/Math.max(list.length,1)*100) + "% of shown leads")
    + statCard(drafted,"Drafts ready to copy", "Copy only — nothing sent")
    + statCard(withEmail,"Leads with an email", (list.length-withEmail) + " still need one")
    + statCard(withSite,"Leads with a website", (list.length-withSite) + " have no website")
    + statCard(visibleFb().length,"Facebook businesses", "8 countries")
    + '</div>'
    + '<div class="grid two" style="margin-top:14px">'
    + '<section class="card"><h2>Per-source progress — honest daily target ' + esc(String(settings.target)) + ' researched leads</h2>'
    + sources.map(s=>{ const n=c[s]||0; const pct=Math.min(100,Math.round(n/settings.target*100));
        return '<div class="progress-row"><span><b>' + esc(s) + '</b> — ' + n + ' / ' + esc(String(settings.target)) + '</span><span>' + pct + '%</span></div><div class="bar"><i style="width:' + pct + '%"></i></div>'; }).join("")
    + '<p class="muted small">Realistic free target: about 10–20 researched leads a day in total — <b>not</b> 100 per source per day. That target is shown separately from the real count and is never padded with filler leads. LinkedIn and Facebook are login-walled with no official group-monitoring API — those leads come in through Add Lead or CSV import.</p></section>'
    + '<section class="card"><h2>Pipeline funnel</h2><div class="funnel">'
    + funnel.map(([k,v])=>'<div class="funnel-step"><span>' + esc(k) + '</span><b>' + v + '</b></div>').join("")
    + '</div><p class="muted small">Change a lead&rsquo;s status from its card or its detail view.</p></section>'
    + '</div>'
    + '<div class="grid two" style="margin-top:14px">'
    + '<section class="card"><h2>Leads per source</h2>' + barList(sources.map(s=>[s, c[s]||0])) + '</section>'
    + '<section class="card"><h2>Intent mix</h2>' + barList([["High",list.filter(l=>l.intent==="High").length],["Medium",list.filter(l=>l.intent==="Medium").length],["Low",list.filter(l=>l.intent==="Low").length]]) + '<h2 style="margin-top:18px">Next up</h2><p>Open <b>Review Queue</b> to copy the next draft, or <b>Pitch Studio</b> to write pitches for the leads that still need one. The daily run is ' + esc(String(settings.time)) + ' Asia/Dhaka.</p></section>'
    + '</div>';
}
function statCard(num, lbl, sub){ return '<div class="card stat"><div class="num">' + num + '</div><div class="lbl">' + esc(lbl) + '</div><div class="delta">' + esc(sub) + '</div></div>'; }
function barList(rows){
  const max = Math.max(1, ...rows.map(r=>r[1]));
  return rows.map(([k,v])=>'<div class="progress-row"><span>' + esc(k) + '</span><b>' + v + '</b></div><div class="bar"><i style="width:' + Math.round(v/max*100) + '%"></i></div>').join("");
}

// ---------- Leads ----------
const SOURCES=[["All leads",""],["LinkedIn","LinkedIn"],["Facebook","Facebook"],["Upwork","Upwork"],["Reddit","Reddit"],["X","X"],["Indie Hackers","Indie Hackers"],["Clutch","Clutch"],["Web Search","Web Search"],["Google Maps","Google Maps"],["Drafts to copy","__drafts"]];
function sortLeads(arr){
  const a = arr.slice();
  if(sortBy === "name") a.sort((x,y)=>x.name.localeCompare(y.name));
  else if(sortBy === "match") a.sort((x,y)=>y.match - x.match);
  else if(sortBy === "intent"){ const rank={High:0,Medium:1,Low:2}; a.sort((x,y)=>(rank[x.intent]??1)-(rank[y.intent]??1)); }
  else a.sort((x,y)=>(+y.id) - (+x.id)); // newest first
  return a;
}
function filteredLeads(){
  const q=(($("#search")||{}).value||"").toLowerCase();
  let base = visibleLeads();
  if(currentTab === "__drafts") base = base.filter(l=>l.outreach);
  else if(currentTab) base = base.filter(l=>l.source===currentTab);
  const out = base.filter(l=>{
    if(statusFilter && l.status!==statusFilter) return false;
    if(intentFilter && l.intent!==intentFilter) return false;
    if(q && !(l.name+" "+l.company+" "+l.want+" "+l.lookingFor+" "+l.location).toLowerCase().includes(q)) return false;
    return true;
  });
  return sortLeads(out);
}
function viewLeads(){
  const list = visibleLeads();
  const c=counts(list);
  const draftCount=list.filter(l=>l.outreach).length;
  const tabs=SOURCES.map(([label,src])=>{
    const n = src==="__drafts" ? draftCount : src ? (c[src]||0) : list.length;
    return '<button type="button" role="tab" class="tab-btn' + (currentTab===src?" active":"") + '" data-tab="' + esc(src) + '">' + esc(label) + ' <span class="count">' + n + '</span></button>';
  }).join("");
  const isDrafts = currentTab==="__drafts";
  const filtered = filteredLeads();
  return '<nav class="source-tabs" role="tablist" aria-label="Leads by source">' + tabs + '</nav>'
    + '<div class="toolbar"><span class="muted small" id="listCount">' + filtered.length + ' lead(s) · ' + list.length + ' shown (' + realLeads().length + ' real)</span>'
    + '<select id="statusFilter" aria-label="Filter by status"><option value="">All statuses</option>' + ["New","Contacted","Replied","Qualified","Proposal Sent","Won","Lost","Not Interested"].map(s=>'<option' + (statusFilter===s?" selected":"") + '>' + s + '</option>').join("") + '</select>'
    + '<select id="intentFilter" aria-label="Filter by intent"><option value="">All intents</option>' + ["High","Medium","Low"].map(s=>'<option' + (intentFilter===s?" selected":"") + '>' + s + '</option>').join("") + '</select>'
    + '<select id="sortBy" aria-label="Sort leads"><option value="newest"' + (sortBy==="newest"?" selected":"") + '>Newest first</option><option value="name"' + (sortBy==="name"?" selected":"") + '>Name A–Z</option><option value="match"' + (sortBy==="match"?" selected":"") + '>Match: high to low</option><option value="intent"' + (sortBy==="intent"?" selected":"") + '>Intent: High first</option></select>'
    + '<button class="btn" id="exportBtn" type="button">Export CSV</button></div>'
    + (isDrafts ? '<div id="draftsList">' + draftItems(filtered) + '</div>'
      : '<div class="lead-grid">' + (filtered.map(leadCard).join("") || '<p class="empty">No leads match these filters. Try clearing the search or adding a lead.</p>') + '</div>');
}
function draftItems(items){
  if(!items.length) return "<p class='empty'>No drafts yet — write a pitch for a lead and it will appear here to copy.</p>";
  return items.map(l=>{
    const isSocial=l.source==="LinkedIn"||l.source==="Facebook";
    return '<div class="draft-item"><div class="audit-row"><span><b>' + esc(l.name) + '</b> — ' + esc(l.company) + ' · ' + esc(l.source) + ' · ' + esc(l.intent) + ' intent' + (l.sample?' · <span class="tag">SAMPLE</span>':'') + '</span><span>' + (isSocial?"Summary only — platform message":"Email draft ready") + '</span></div>'
      + '<p class="muted small">Subject: ' + esc(subjectFor(l)) + '</p>'
      + '<p class="draft-box">' + esc(l.outreach) + '</p>'
      + '<div class="copy-row"><button type="button" class="copy-btn" data-copy="fullemail" data-id="' + l.id + '">Copy full email</button><button type="button" class="copy-btn" data-copy="draft" data-id="' + l.id + '">Copy draft</button><button type="button" class="copy-btn" data-copy="followup" data-id="' + l.id + '">Copy follow-up</button></div></div>';
  }).join("");
}
function leadCard(l){
  const isSocial=l.source==="LinkedIn"||l.source==="Facebook";
  const draftLabel=isSocial?"Say first — platform message":"Email draft";
  const auditBody = l.audit
    ? '<p><b>UI/UX score: ' + l.audit.score + '/100</b> <span class="muted small">(' + esc(l.audit.method) + ')</span></p><p><b>Problems found:</b></p><ul>' + l.audit.top.map(p=>'<li>' + esc(p) + '</li>').join("") + '</ul><p><b>How you can fix them:</b></p><ul>' + l.audit.wins.map(p=>'<li>' + esc(p) + '</li>').join("") + '</ul>'
    : '<p class="muted">No website to check — this lead has no site, so there is nothing to audit.</p><p><b>How you can fix it:</b> build a first website with a clear services page, contact/enquiry and booking information, so Maps and search visitors have somewhere to go next.</p>';
  return '<article class="lead" data-id="' + l.id + '">'
    + '<div class="lead-head"><div class="avatar">' + esc(initials(l.name)) + '</div><div><strong>' + esc(l.name) + '</strong><small>' + esc(l.role) + ' · ' + esc(l.company) + '</small><br><small>' + esc(l.location) + ' · ' + esc(l.group) + '</small></div><span class="badge ' + esc(l.intent) + '">' + esc(l.intent) + ' intent</span></div>'
    + '<div class="lead-cat"><h4>Contact</h4><p>Email: ' + (l.email ? esc(l.email) + ' <button type="button" class="copy-btn" data-copy="email" data-id="' + l.id + '">Copy</button>' : '<span class="muted">Email not found</span>') + '</p><p>Phone: ' + (l.phone ? esc(l.phone) : '<span class="muted">No phone listed</span>') + '</p></div>'
    + '<div class="lead-cat"><h4>Business &amp; website</h4><p>' + esc(l.company) + ' · ' + esc(l.industry) + '</p><p>' + (isRealUrl(l.website) ? '<a href="' + esc(l.website) + '" target="_blank" rel="noopener">' + esc(l.website) + '</a>' : '<span class="muted">No website</span>') + '</p></div>'
    + linksRow(l)
    + '<div class="lead-cat"><h4>Their problem</h4><p>' + esc(l.want) + '</p><ul>' + l.problems.map(p=>'<li>' + esc(p) + '</li>').join("") + '</ul></div>'
    + '<div class="lead-cat"><h4>' + draftLabel + '</h4><p class="draft-box">' + esc(l.outreach || "No draft yet — run automation and one is written here for you to copy.") + '</p><div class="copy-row"><button type="button" class="copy-btn" data-copy="draft" data-id="' + l.id + '">Copy draft</button><button type="button" class="copy-btn" data-copy="followup" data-id="' + l.id + '">Copy follow-up</button></div></div>'
    + '<details class="audit-details"><summary>Website check ' + (l.audit ? '— ' + l.audit.score + '/100' : '— no website') + '</summary>' + auditBody
    + (isRealUrl(l.website) ? '<p><button type="button" class="copy-btn" data-copy="fixes" data-id="' + l.id + '">Copy problems &amp; fixes</button> <button type="button" class="btn small" data-audit="' + l.id + '">Run website check</button></p>' : '<p><button type="button" class="copy-btn" data-copy="fixes" data-id="' + l.id + '">Copy problems &amp; fixes</button></p>')
    + '</details>'
    + '<div class="score">Match ' + l.match + '/100' + (l.audit ? ' · Website check ' + l.audit.score + '/100' : ' · No website to audit') + (l.sample ? ' · <span class="tag">SAMPLE</span>' : '') + '</div>'
    + '<div class="lead-foot"><span class="tag">' + esc(l.source) + '</span><span class="tag">' + esc(l.industry) + '</span><select data-status="' + l.id + '" aria-label="Status">' + ["New","Contacted","Replied","Qualified","Proposal Sent","Won","Lost","Not Interested"].map(s=>'<option' + (s===l.status?" selected":"") + '>' + s + '</option>').join("") + '</select></div>'
    + '</article>';
}

// ---------- Companies / Audits / Log ----------
function viewCompanies(){
  const by = {};
  visibleLeads().forEach(l=>{ const k=(l.company||"").trim() || "Unnamed lead (no company)"; (by[k]=by[k]||[]).push(l); });
  const rows = Object.keys(by).sort().map(k=>{
    const g=by[k];
    const site=g.find(x=>isRealUrl(x.website));
    return '<tr><td><b>' + esc(k) + '</b><br><span class="muted small">' + g.length + ' lead(s)</span></td><td>' + (site ? '<a href="' + esc(site.website) + '" target="_blank" rel="noopener">' + esc(site.website) + '</a>' : '<span class="muted">No website</span>') + '</td><td>' + g.map(x=>esc(x.name)).join(", ") + '</td><td>' + g.map(x=>esc(x.source)).join(", ") + '</td></tr>';
  }).join("");
  return '<section class="card"><h2>Companies (' + Object.keys(by).length + ')</h2><p class="muted small">Grouped by company name. Leads with no company name are grouped under “Unnamed lead (no company)” instead of a blank row.</p><div class="table-wrap"><table class="table"><thead><tr><th>Company</th><th>Website</th><th>People</th><th>Sources</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
}
function viewAudits(){
  const noSite = visibleLeads().filter(l=>!l.website);
  return '<div class="grid two"><section class="card"><h2>Completed checks (' + audits.length + ')</h2>'
    + (audits.length ? audits.map(a=>'<div class="audit-row"><span><b>' + esc(a.company) + '</b><br><span class="muted small">' + esc(a.method) + ' · ' + esc(a.date) + '<br>' + esc((a.top||[])[0]||"") + '</span></span><span class="score-pill ' + (a.score>=70?"good":a.score>=40?"mid":"bad") + '">' + a.score + '/100</span></div>').join("") : '<p class="muted">No website checks run yet in this file. Open any lead that has a website and press <b>Run website check</b> on its card or in its detail view. The hosted dashboard holds the live audits — the best real one so far is Caring Hands, Inc., 42/100, with 5 audited problems and 3 quick-win fixes.</p>')
    + '</section><section class="card"><h2>No website to audit (' + noSite.length + ')</h2><p>These leads have no website, so there is nothing to audit — the pitch is a <b>first website</b>, not a redesign. The problem to lead with is the missing website itself, and the fix is a services page, contact/enquiry and booking information.</p><p class="muted small">Every check here is a <b>local pre-check</b> scored only from facts in the lead record. It is not a Lighthouse or PageSpeed audit — for a full free audit, paste the site into PageSpeed Insights (free key, 25,000/day — see README).</p></section></div>'
    + '<section class="card" style="margin-top:14px"><h2>What a check covers</h2><p>Website present · contact routes (email / phone) · clear service description · documented problems · intent. Each check returns a score out of 100, the top problems with where they appear, quick wins, and the fix. A check is only ever run for a lead that has a website — no website means “No website”, never a fake audit.</p></section>';
}
function viewLog(){
  return '<section class="card"><h2>Collection log (' + runLog.length + ' events)</h2><p class="muted small">Every import, lead added, business added, website check and export in this file is logged here with its real result. The first rows are the hosted dashboard&rsquo;s history; newer rows are this file&rsquo;s own events.</p><div class="table-wrap"><table class="table"><thead><tr><th>When</th><th>Source</th><th>Result</th><th>Count</th></tr></thead><tbody>'
    + runLog.map(r=>'<tr><td>' + esc(r.date) + '</td><td>' + esc(r.source) + '</td><td>' + esc(r.result) + '</td><td>' + r.count + '</td></tr>').join("")
    + '</tbody></table></div></section>';
}

// ---------- Review Queue / Pitch Studio / Job Hub ----------
function viewReview(){
  const list = visibleLeads();
  const queue = list.filter(l=>l.outreach);
  const noEmail = queue.filter(l=>!l.email);
  return '<div class="grid stats"><div class="card stat"><div class="num">' + queue.length + '</div><div class="lbl">Drafts waiting</div><div class="delta">Copy only — nothing sent</div></div>'
    + '<div class="card stat"><div class="num">' + noEmail.length + '</div><div class="lbl">Waiting for an email</div><div class="delta">Pitch by phone / in person</div></div>'
    + '<div class="card stat"><div class="num">' + queue.filter(l=>l.email).length + '</div><div class="lbl">Ready to send by email</div><div class="delta">Copy the draft, send it yourself</div></div></div>'
    + '<section class="card" style="margin-top:14px"><h2>Review Queue — morning inbox</h2>' + draftItems(queue) + '</section>';
}
function viewPitch(){
  const first = visibleLeads()[0] || {name:"Alex", company:"your company", want:"a new website", problems:["the hero does not explain what you do","the call to action is hard to find","the site is hard to use on mobile"], source:"Web Search"};
  const filled = PITCH_TEMPLATES.map(t=>fill(t.body, first));
  return '<section class="card"><h2>Pitch Studio — senior pitch templates</h2><p class="muted">Hook → what the problem costs them → the fix → the offer → one soft ask. No-website leads get a why-you-need-a-website pitch; website owners get a redesign pitch built from their audit. LinkedIn and Facebook leads get a platform message, never an email draft. Templates below are filled with ' + esc(first.name) + ' (' + esc(first.company) + ') so what you copy is a real draft — never literal {{name}} placeholders.</p>'
    + PITCH_TEMPLATES.map((t,i)=>'<div class="pitch-template"><h3>' + esc(t.name) + '</h3><p class="muted small">Subject: ' + esc(fill(t.subject, first)) + '</p><pre>' + esc(filled[i]) + '</pre><div class="copy-row"><button type="button" class="copy-btn" data-template-filled="' + i + '">Copy filled template</button><button type="button" class="copy-btn" data-template="' + i + '">Copy raw template</button></div></div>').join("")
    + '<div class="pitch-template"><h3>Follow-up draft (send in 3–5 days)</h3><pre>' + esc(fill(FOLLOWUP_TEMPLATE, first)) + '</pre><div class="copy-row"><button type="button" class="copy-btn" data-followup-template="1">Copy follow-up template</button></div></div>'
    + '<h2 style="margin-top:20px">Every draft, ready to copy</h2>' + draftItems(visibleLeads().filter(l=>l.outreach)) + '</section>';
}
function viewJobHub(){
  const fu = JOB_HUB.followups.length, ap = JOB_HUB.applications.length, ma = JOB_HUB.matches.length, rp = JOB_HUB.replies.length;
  return '<div class="grid stats"><div class="card stat"><div class="num">' + fu + '</div><div class="lbl">Follow-up drafts</div><div class="delta">Sent ~02:40, 25 Nov</div></div>'
    + '<div class="card stat"><div class="num">' + ap + '</div><div class="lbl">Unanswered applications</div><div class="delta">Last 30 days</div></div>'
    + '<div class="card stat"><div class="num">' + ma + '</div><div class="lbl">New job matches</div><div class="delta">Last 7 days</div></div>'
    + '<div class="card stat"><div class="num">' + rp + '</div><div class="lbl">Application reply</div><div class="delta">Bask Health (Workable)</div></div></div>'
    + '<div class="grid two" style="margin-top:14px"><section class="card"><h2>Follow-up drafts</h2>' + JOB_HUB.followups.map(f=>'<div class="audit-row"><span><b>' + esc(f.to) + '</b><br><span class="muted small">' + esc(f.role) + ' · applied ' + esc(f.date) + '</span></span><span>' + esc(f.state) + '</span></div>').join("") + '</section>'
    + '<section class="card"><h2>Top 10 unanswered applications</h2><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Company</th><th>Role</th><th>Status</th></tr></thead><tbody>' + JOB_HUB.applications.map(a=>'<tr><td>' + esc(a[0]) + '</td><td>' + esc(a[1]) + '</td><td>' + esc(a[2]) + '</td><td>' + esc(a[3]) + '</td></tr>').join("") + '</tbody></table></div></section></div>'
    + '<div class="grid two" style="margin-top:14px"><section class="card"><h2>Recent job matches</h2>' + JOB_HUB.matches.map(m=>'<div class="audit-row"><span><b>' + esc(m[0]) + '</b> — ' + esc(m[1]) + '<br><span class="muted small">' + esc(m[2]) + '</span></span><span>' + esc(m[3]) + '</span></div>').join("") + '</section>'
    + '<section class="card"><h2>Replies &amp; alerts</h2>' + JOB_HUB.replies.map(r=>'<p><b>' + esc(r.from) + '</b><br>' + esc(r.text) + '</p>').join("") + '<h3>Repeated alert noise</h3>' + JOB_HUB.noise.map(n=>'<div class="audit-row"><span><b>' + esc(n[0]) + '</b> — ' + esc(n[2]) + '</span><b>' + n[1] + '</b></div>').join("") + '<p class="muted small">Client-outreach reply tracking is OFF, as requested. Nothing here is archived or unsubscribed automatically.</p></section></div>';
}

// ---------- Google Maps view ----------
function viewMaps(){
  const list = visibleMaps();
  const tabs = ["All countries"].concat(MAPS_COUNTRIES).map(c=>{
    const n = c==="All countries" ? list.length : list.filter(b=>b.country===c).length;
    const active = (currentMapsCountry==="" && c==="All countries") || currentMapsCountry===c;
    return '<button type="button" class="tab-btn' + (active?" active":"") + '" data-maps="' + esc(c==="All countries"?"":c) + '">' + esc(c) + ' <span class="count">' + n + '</span></button>';
  }).join("");
  const shown = list.filter(b=>!currentMapsCountry || b.country===currentMapsCountry);
  return '<section class="card"><h2>Businesses with no website — pitch them a first website</h2><p class="muted">Each business was verified to have <b>no website link</b> on its Google Maps listing before it was saved. Businesses with a site are skipped and counted, never saved. Pitches wait in the Review Queue as “pitch by phone / in person” because Maps rarely shows an email.</p><nav class="source-tabs">' + tabs + '</nav>'
    + '<div class="table-wrap"><table class="table"><thead><tr><th>Business</th><th>Category</th><th>Location</th><th>Phone</th><th>Links</th></tr></thead><tbody>'
    + shown.map(b=>'<tr><td><b>' + esc(b.name) + '</b>' + (b.sample?' <span class="tag">SAMPLE</span>':'') + '</td><td>' + esc(b.category) + '</td><td>' + esc(b.city) + ', ' + esc(b.country) + '</td><td>' + (b.phone && b.phone!=="Not available" ? esc(b.phone) : '<span class="muted">Not available</span>') + '</td><td><a href="' + esc(mapsLinkFor(b)) + '" target="_blank" rel="noopener">Google Maps ↗</a></td></tr>').join("")
    + '</tbody></table></div></section>'
    + '<section class="card"><h2>Add a business</h2><form id="addMapsForm" class="form"><label>Business name<input name="name" required></label><label>Category<input name="category" placeholder="Dentist / Salon / Cafe"></label><label>City<input name="city" required></label><label>Country<select name="country">' + MAPS_COUNTRIES.map(c=>'<option>' + c + '</option>').join("") + '</select></label><label>Phone (if listed)<input name="phone"></label><button class="btn primary" type="submit">Add business</button></form><p class="muted small">Only add a business after checking its Maps listing has no website link.</p></section>';
}

// ---------- Facebook Businesses view ----------
function viewFb(){
  const list = visibleFb();
  const tabs = FB_COUNTRIES.map(c=>{
    const n = list.filter(b=>b.country===c).length;
    return '<button type="button" class="tab-btn' + (currentFbCountry===c?" active":"") + '" data-fb="' + esc(c) + '">' + esc(c) + ' <span class="count">' + n + '</span></button>';
  }).join("");
  const shown = list.filter(b=>b.country===currentFbCountry);
  return '<section class="card"><h2>Facebook Businesses — ' + esc(currentFbCountry) + '</h2>'
    + '<p class="muted">Facebook is login-walled, so this static file cannot search Facebook by itself — new businesses are added by you below (Add Business form) or by CSV import, and the sample data shows the format. Each entry links to the business&rsquo;s real Facebook Page.</p>'
    + '<nav class="source-tabs">' + tabs + '</nav>'
    + '<div class="table-wrap"><table class="table"><thead><tr><th>Business</th><th>Category</th><th>Location</th><th>Phone</th><th>Facebook Page</th></tr></thead><tbody>'
    + shown.map(b=>'<tr><td><b>' + esc(b.name) + '</b>' + (b.sample?' <span class="tag">SAMPLE</span>':'') + '</td><td>' + esc(b.category) + '</td><td>' + esc(b.city) + ', ' + esc(b.country) + '</td><td>' + (b.phone && b.phone!=="Not available" ? esc(b.phone) : '<span class="muted">Not available</span>') + '</td><td><a href="' + esc(fbPageLink(b)) + '" target="_blank" rel="noopener">Facebook Page ↗</a></td></tr>').join("")
    + '</tbody></table></div></section>'
    + '<section class="card"><h2>Add a business</h2><form id="addFbForm" class="form"><label>Business name<input name="name" required></label><label>Category<input name="category" placeholder="Coffee shop / Supermarket"></label><label>City<input name="city" required></label><label>Country<select name="country">' + FB_COUNTRIES.map(c=>'<option' + (c===currentFbCountry?" selected":"") + '>' + c + '</option>').join("") + '</select></label><label>Phone (if known)<input name="phone"></label><label>Facebook Page link (real https://www.facebook.com/... URL — leave blank to use Facebook search)<input name="page" type="url" placeholder="https://www.facebook.com/..."></label><button class="btn primary" type="submit">Add business</button></form><p class="muted small">Only paste a real Facebook Page link you have checked. A blank page link falls back to the business&rsquo;s Facebook search page, which always loads.</p></section>';
}

// ---------- Guide / Settings ----------
function viewGuide(){
  const steps = [
    ["Open a source tab", "Pick a source in All Leads — LinkedIn, Facebook, Upwork, Reddit, X, Indie Hackers, Clutch, Web Search or Google Maps — or open Drafts to copy for every ready draft."],
    ["Read the card", "Each card shows Contact (email or “Email not found”, phone), Business & website, Links, Their problem, and the Email draft."],
    ["Check the website", "Expand “Website check” to see the score, the problems found on their site, and how you can fix them. Press “Run website check” on any lead with a website to add a real check to the Audits view. No website means the pitch is a first website."],
    ["Copy the draft", "Hit Copy draft or Copy full email. Sending is up to you — nothing is sent automatically, ever."],
    ["Follow up in 3–5 days", "Copy the follow-up draft from the card or the lead detail view if they do not reply."],
    ["Track the pipeline", "Move the lead through New → Contacted → Replied → Qualified → Proposal Sent → Won / Lost / Not Interested from its card."],
  ];
  return '<section class="card"><h2>How this dashboard works</h2>' + steps.map((s,i)=>'<div class="guide-step"><div class="n">' + (i+1) + '</div><div><b>' + esc(s[0]) + '</b><p class="muted">' + esc(s[1]) + '</p></div></div>').join("")
    + '<h2>Rules this dashboard follows</h2><ul><li>Only publicly shared business information. Official APIs first where available.</li><li>Never invent contact details — if a business email is not publicly available, it shows “Email not found”.</li><li>LinkedIn and Facebook groups are login-walled with no official group-monitoring API — add those leads manually or by CSV. Automated group monitoring does not exist for free (or at any price) — see README, Free Services.</li><li>Drafts are prepared for you to approve and send. Nothing is sent automatically.</li><li>Realistic free target: about 10–20 researched leads a day in total, not 100 per source per day.</li><li>Demo mode: sample data is fictional and counted separately. Turn Demo mode off in Settings to see real data only.</li></ul></section>';
}
function viewSettings(){
  return '<div class="grid two"><section class="card"><h2>Groups, keywords &amp; pages watched</h2><p class="muted small">Saved in your browser (localStorage) in this version.</p>'
    + '<label>LinkedIn groups (one per line)<textarea id="setLinkedIn" rows="4">' + esc(settings.linkedin) + '</textarea></label>'
    + '<label>Facebook groups (one per line)<textarea id="setFacebook" rows="7">' + esc(settings.facebook) + '</textarea></label>'
    + '<p class="muted small">Your profiles: <a href="https://www.linkedin.com/in/mahmudurashid/" target="_blank" rel="noopener">LinkedIn</a> · <a href="https://www.facebook.com/mahmud.ahbab.2024" target="_blank" rel="noopener">Facebook</a> · <a href="https://mahmudur-rashid-website.vercel.app" target="_blank" rel="noopener">Portfolio</a></p>'
    + '<p class="muted small"><b>LinkedIn &amp; Facebook: Needs connection.</b> Groups are login-walled and there is no official group-monitoring API (the Groups API was removed in April 2024). Do not scrape with a personal login — it risks an account block. Add those leads manually or by CSV import.</p>'
    + '<label>Keywords (comma separated)<input id="setKeywords" value="' + esc(settings.keywords) + '"></label>'
    + '<label>Honest daily target (researched leads per day)<input id="setTarget" type="number" min="1" max="100" value="' + esc(String(settings.target)) + '"></label>'
    + '<p class="muted small">Free, honest target: about 10–20 researched leads a day in total. 100 per source per day is not reachable for free — see README, Free Services.</p>'
    + '<label>Daily run time<input id="setTime" value="' + esc(settings.time) + '"></label>'
    + '<label>Demo mode — show clearly-labelled SAMPLE data <select id="setDemo"><option value="on"' + (settings.demoMode?" selected":"") + '>ON — samples shown, counted separately</option><option value="off"' + (!settings.demoMode?" selected":"") + '>OFF — real data only</option></select></label>'
    + '<button class="btn primary" id="saveSettingsBtn" type="button">Save settings</button> <span class="muted small" id="settingsSaved"></span></section>'
    + '<section class="card"><h2>Appearance</h2><p>Theme follows your system setting on first visit and is saved on this device.</p><p><button class="btn" id="themeBtnSettings" type="button">Toggle Light / AMOLED</button></p>'
    + '<h2>Import leads (CSV)</h2><p class="muted small">Columns: name, role, company, website, email, source, intent, industry, location, want. Quoted fields with commas are handled correctly. Only real https:// website URLs are linked — anything else is left blank. Duplicates by email (or by name + company when no email) are skipped. Imported leads get a full outreach draft, so they appear in the Review Queue.</p><input type="file" id="csvFile" accept=".csv">'
    + '<h2>Pitch Studio settings — offer, tone and signature</h2>'
    + '<label>Your name<input id="setSender" value="' + esc(settings.senderName) + '"></label>'
    + '<label>Offer (used in pitches)<input id="setOffer" value="' + esc(settings.offer) + '"></label>'
    + '<label>Tone<input id="setTone" value="' + esc(settings.tone) + '"></label>'
    + '<label>Signature (used at the end of every draft)<textarea id="setSignature" rows="3">' + esc(settings.signature) + '</textarea></label>'
    + '<button class="btn primary" id="savePitchBtn" type="button">Save Pitch Studio settings</button> <span class="muted small" id="pitchSaved"></span>'
    + '<h2>Backup &amp; restore</h2><p class="muted small">Export CSV backs up your leads (all columns, including phone, problems, status, notes and audit score). Keep the file somewhere safe — this static version stores everything in your browser only.</p><button class="btn" id="exportBtn2" type="button">Export all leads (CSV)</button></section></div>';
}

// ---------- Lead detail modal ----------
function openLead(id){
  const l = leads.find(x=>String(x.id)===String(id)); if(!l) return;
  $("#modalContent").innerHTML =
    '<h2>' + esc(l.name) + ' ' + (l.sample?'<span class="tag">SAMPLE</span>':'') + '</h2>'
    + '<p class="muted">' + esc(l.role) + ' · ' + esc(l.company) + ' · ' + esc(l.location) + ' · ' + esc(l.source) + ' — ' + esc(l.group) + '</p>'
    + '<h3>What they want</h3><p>' + esc(l.want) + '</p>'
    + '<h3>What they are looking for</h3><p>' + esc(l.lookingFor) + '</p>'
    + '<h3>Problems they are facing</h3><ul>' + l.problems.map(p=>'<li>' + esc(p) + '</li>').join("") + '</ul>'
    + '<h3>Urgency &amp; budget</h3><p>' + esc(l.urgency) + '</p>'
    + '<h3>Contact</h3><dl class="kv"><dt>Email</dt><dd>' + (l.email ? esc(l.email) + ' <button type="button" class="copy-btn" data-copy="email" data-id="' + l.id + '">Copy</button>' : 'Email not found — do not guess') + '</dd><dt>Phone</dt><dd>' + (l.phone ? esc(l.phone) : 'No phone listed') + '</dd><dt>Industry</dt><dd>' + esc(l.industry) + '</dd><dt>Match</dt><dd>' + l.match + '/100 · ' + esc(l.intent) + ' intent · Status: ' + esc(l.status) + '</dd></dl>'
    + '<h3>Links</h3><dl class="kv">' + linksDetail(l) + '</dl>'
    + (l.audit ? '<h3>Website check — score ' + l.audit.score + '/100</h3><p class="muted small">' + esc(l.audit.method) + ' · ' + esc(l.audit.date) + '</p><p><b>Problems found:</b></p><ul>' + l.audit.top.map(p=>'<li>' + esc(p) + '</li>').join("") + '</ul><p><b>How you can fix them:</b></p><ul>' + l.audit.wins.map(p=>'<li>' + esc(p) + '</li>').join("") + '</ul><p><button type="button" class="copy-btn" data-copy="fixes" data-id="' + l.id + '">Copy problems &amp; fixes</button></p>'
      : '<h3>Website check</h3><p class="muted">No website to audit — this lead has no site.</p><p><b>How you can fix it:</b> build a first website with a clear services page, contact/enquiry and booking information.</p>')
    + (isRealUrl(l.website) ? '<p><button type="button" class="btn small" data-audit="' + l.id + '">Run website check</button></p>' : '')
    + '<h3>Suggested outreach</h3><p class="draft-box">' + esc(l.outreach) + '</p>'
    + '<p><button type="button" class="btn copy-btn" data-copy="draft" data-id="' + l.id + '">Copy draft</button> <button type="button" class="btn copy-btn" data-copy="fullemail" data-id="' + l.id + '">Copy full email</button></p>'
    + '<h3>Follow-up draft (send in 3–5 days)</h3><p class="draft-box">' + esc(followupFor(l)) + '</p>'
    + '<p><button type="button" class="btn copy-btn" data-copy="followup" data-id="' + l.id + '">Copy follow-up</button></p>'
    + '<h3>Notes</h3><textarea class="notes" id="leadNotes" placeholder="Add a note about this lead…">' + esc(l.notes||"") + '</textarea><p><button type="button" class="btn" id="saveNotesBtn">Save note</button></p>';
  $("#modalBackdrop").classList.remove("hidden");
  const sn = $("#saveNotesBtn");
  if(sn) sn.addEventListener("click", ()=>{ l.notes = $("#leadNotes").value; save(); sn.textContent = "Saved ✓"; setTimeout(()=>sn.textContent="Save note", 1500); });
  $$("#modalContent [data-audit]").forEach(b=>b.addEventListener("click", ()=>{ const a = runAudit(l); if(a){ render(); openLead(l.id); } }));
}
function closeModals(){
  const m = $("#modalBackdrop"); if(m) m.classList.add("hidden");
  const a = $("#addBackdrop"); if(a) a.classList.add("hidden");
}

// ---------- Bindings ----------
function bindView(){
  $$("[data-tab]").forEach(b=>b.addEventListener("click",()=>{ currentTab=b.dataset.tab; render(); }));
  $$("[data-maps]").forEach(b=>b.addEventListener("click",()=>{ currentMapsCountry=b.dataset.maps; render(); }));
  $$("[data-fb]").forEach(b=>b.addEventListener("click",()=>{ currentFbCountry=b.dataset.fb; render(); }));
  $$(".lead").forEach(el=>el.addEventListener("click",e=>{ if(e.target.closest("select,button,a,details,summary")) return; openLead(el.dataset.id); }));
  $$("[data-status]").forEach(sel=>sel.addEventListener("change",e=>{ e.stopPropagation(); const l=leads.find(x=>String(x.id)===String(sel.dataset.status)); if(l){ l.status=sel.value; save(); render(); } }));
  $$("[data-audit]").forEach(b=>b.addEventListener("click",e=>{ e.stopPropagation(); const l=leads.find(x=>String(x.id)===String(b.dataset.audit)); if(l && runAudit(l)){ render(); } }));
  const sf=$("#statusFilter"); if(sf) sf.addEventListener("change",()=>{ statusFilter=sf.value; render(); });
  const inf=$("#intentFilter"); if(inf) inf.addEventListener("change",()=>{ intentFilter=inf.value; render(); });
  const sb=$("#sortBy"); if(sb) sb.addEventListener("change",()=>{ sortBy=sb.value; render(); });
  const eb=$("#exportBtn"); if(eb) eb.addEventListener("click", exportCsv);
  const eb2=$("#exportBtn2"); if(eb2) eb2.addEventListener("click", exportCsv);
  const ss=$("#saveSettingsBtn"); if(ss) ss.addEventListener("click", ()=>{
    settings.linkedin=$("#setLinkedIn").value; settings.facebook=$("#setFacebook").value;
    settings.keywords=$("#setKeywords").value; settings.target=+$("#setTarget").value||20; settings.time=$("#setTime").value;
    settings.demoMode = $("#setDemo").value === "on";
    saveSettings(); $("#settingsSaved").textContent="Saved in this browser."; render();
  });
  const sp=$("#savePitchBtn"); if(sp) sp.addEventListener("click", ()=>{
    settings.senderName=$("#setSender").value; settings.offer=$("#setOffer").value; settings.tone=$("#setTone").value; settings.signature=$("#setSignature").value;
    saveSettings(); $("#pitchSaved").textContent="Saved — new drafts will use this offer and signature.";
  });
  const ts=$("#themeBtnSettings"); if(ts) ts.addEventListener("click", ()=>setTheme(document.documentElement.getAttribute("data-theme")==="amoled" ? "light" : "amoled"));
  const cf=$("#csvFile"); if(cf) cf.addEventListener("change", importCsv);
  const amf=$("#addMapsForm"); if(amf) amf.addEventListener("submit", e=>{
    e.preventDefault(); const f=new FormData(e.target);
    mapsBusinesses.unshift({id:nextId(mapsBusinesses), name:f.get("name"), category:f.get("category")||"Business", city:f.get("city"), country:f.get("country"), phone:f.get("phone")||"Not available", sample:false});
    saveMaps(); logEvent("Google Maps", "Business added: " + f.get("name") + " (" + f.get("city") + ", " + f.get("country") + ")", 1); render();
  });
  const aff=$("#addFbForm"); if(aff) aff.addEventListener("submit", e=>{
    e.preventDefault(); const f=new FormData(e.target);
    const page=String(f.get("page")||"").trim();
    if(page && !isRealUrl(page)){ alert("That Facebook link does not look like a real https://www.facebook.com/... URL — it was left blank and the search page will be used instead."); }
    fbBusinesses.unshift({id:nextId(fbBusinesses), name:f.get("name"), category:f.get("category")||"Business", city:f.get("city"), country:f.get("country"), phone:f.get("phone")||"Not available", page:isRealUrl(page)?page:"", sample:false});
    saveFb(); logEvent("Facebook Businesses", "Business added: " + f.get("name") + " (" + f.get("city") + ", " + f.get("country") + ")", 1); render();
  });
  $$("[data-template]").forEach(b=>b.addEventListener("click", ()=>copyText(PITCH_TEMPLATES[+b.dataset.template].body, b)));
  $$("[data-template-filled]").forEach(b=>b.addEventListener("click", ()=>{
    const first = visibleLeads()[0] || {name:"Alex", company:"your company", want:"a new website", problems:["the hero does not explain what you do","the call to action is hard to find","the site is hard to use on mobile"], source:"Web Search"};
    copyText(fill(PITCH_TEMPLATES[+b.dataset.templateFilled].body, first), b);
  }));
  $$("[data-followup-template]").forEach(b=>b.addEventListener("click", ()=>{
    const first = visibleLeads()[0] || {name:"Alex", company:"your company", want:"a new website", problems:[], source:"Web Search"};
    copyText(fill(FOLLOWUP_TEMPLATE, first), b);
  }));
}
const EXPORT_COLUMNS = ["name","role","company","website","email","phone","source","intent","industry","location","want","problems","match","status","notes","auditScore","linkedinUrl","facebookUrl"];
function exportCsv(){
  const rows=[EXPORT_COLUMNS.join(",")].concat(filteredLeads().map(l=>{
    const v = {name:l.name, role:l.role, company:l.company, website:l.website, email:l.email, phone:l.phone, source:l.source, intent:l.intent, industry:l.industry, location:l.location, want:l.want, problems:(l.problems||[]).join("; "), match:l.match, status:l.status, notes:l.notes, auditScore:l.audit?l.audit.score:"", linkedinUrl:l.linkedinUrl, facebookUrl:l.facebookUrl};
    return EXPORT_COLUMNS.map(k=>csvEscape(v[k])).join(",");
  }));
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([rows.join("\n")],{type:"text/csv"})); a.download="leads.csv"; a.click();
  logEvent("CSV export", "Exported " + filteredLeads().length + " lead(s) (" + EXPORT_COLUMNS.length + " columns)", filteredLeads().length);
}
function importCsv(e){
  const file=e.target.files[0]; if(!file) return;
  const rd=new FileReader(); rd.onload=()=>{
    const parsed = parseCSV(rd.result);
    if(parsed.errors.length){ alert("Import failed: " + parsed.errors[0]); e.target.value=""; return; }
    let added=0, skipped=0; const errs=[];
    parsed.rows.forEach((r,i)=>{
      const name=(r.name||"").trim();
      if(!name){ errs.push("Row " + (i+2) + ": no name — skipped."); return; }
      const email=(r.email||"").trim();
      const dup = email ? leads.some(x=>x.email && x.email.toLowerCase()===email.toLowerCase())
                        : leads.some(x=>!x.email && x.name.toLowerCase()===name.toLowerCase() && (x.company||"").toLowerCase()===((r.company||"").trim().toLowerCase()));
      if(dup){ skipped++; return; }
      const lead = sanitize({
        id: nextId(leads), name: name, role: r.role||"", company: r.company||"", website: r.website||"",
        email: email, phone: r.phone||"", location: r.location||"", source: r.source||"LinkedIn",
        intent: r.intent||"Medium", industry: r.industry||"—", match: 75,
        want: r.want||"", lookingFor: r.want||"", problems: r.problems ? String(r.problems).split(";").map(s=>s.trim()).filter(Boolean) : [],
        urgency: "—", group: "CSV import", postDate: "2026-11-27", status: "New", notes: r.notes||"",
        sample: false, audit: null, linkedinUrl: r.linkedinurl||"", facebookUrl: r.facebookurl||"",
        upworkUrl:"", redditUrl:"", xUrl:"", behanceUrl:"", dribbbleUrl:"", outreach:""
      });
      lead.outreach = generateOutreach(lead); // imported leads get a full draft, so they reach the Review Queue
      leads.unshift(lead); added++;
    });
    save();
    logEvent("CSV import", "Imported " + added + " lead(s), skipped " + skipped + " duplicate(s)" + (errs.length ? ", " + errs.length + " row error(s)" : ""), added);
    render();
    alert(added + " lead(s) imported, " + skipped + " duplicate(s) skipped." + (errs.length ? "\n" + errs.slice(0,5).join("\n") : ""));
    e.target.value="";
  }; rd.readAsText(file);
}

// One delegated handler for every Copy button in the app.
if(typeof document !== "undefined"){
  document.addEventListener("click", e=>{
    const btn=e.target.closest("[data-copy]"); if(!btn) return;
    e.stopPropagation();
    const l=leads.find(x=>String(x.id)===String(btn.dataset.id)); if(!l) return;
    const kind=btn.dataset.copy;
    const text = kind==="email" ? l.email : kind==="followup" ? followupFor(l) : kind==="fixes" ? fixesTextFor(l) : kind==="fullemail" ? fullEmailFor(l) : l.outreach;
    if(!text){ alert("Nothing to copy yet — no draft or email for this lead."); return; }
    copyText(text, btn);
  });
  document.addEventListener("keydown", e=>{
    if(e.key === "Escape"){
      closeModals();
      const sb = $("#sidebar"); if(sb) sb.classList.remove("open");
      const scr = $("#scrim"); if(scr) scr.classList.add("hidden");
    }
  });
  document.addEventListener("DOMContentLoaded", ()=>{
    paintThemeBtns();
    const toggle=()=>setTheme(document.documentElement.getAttribute("data-theme")==="amoled" ? "light" : "amoled");
    const t1=$("#themeBtn"); if(t1) t1.addEventListener("click", toggle);
    const t2=$("#themeBtnSide"); if(t2) t2.addEventListener("click", toggle);
    const mb=$("#menuBtn"); if(mb) mb.addEventListener("click", ()=>{ $("#sidebar").classList.add("open"); $("#scrim").classList.remove("hidden"); });
    const sc=$("#sidebarClose"); if(sc) sc.addEventListener("click", ()=>{ $("#sidebar").classList.remove("open"); $("#scrim").classList.add("hidden"); });
    const scr=$("#scrim"); if(scr) scr.addEventListener("click", ()=>{ $("#sidebar").classList.remove("open"); $("#scrim").classList.add("hidden"); });
    const s=$("#search"); if(s) s.addEventListener("input", ()=>{ if(currentView!=="leads"){ currentTab=""; go("leads"); } else render(); });
    const mc=$("#modalClose"); if(mc) mc.addEventListener("click", ()=>$("#modalBackdrop").classList.add("hidden"));
    const mbd=$("#modalBackdrop"); if(mbd) mbd.addEventListener("click", e=>{ if(e.target.id==="modalBackdrop") e.target.classList.add("hidden"); });
    const ab=$("#addBtn"); if(ab) ab.addEventListener("click", ()=>$("#addBackdrop").classList.remove("hidden"));
    const ac=$("#addClose"); if(ac) ac.addEventListener("click", ()=>$("#addBackdrop").classList.add("hidden"));
    const adb=$("#addBackdrop"); if(adb) adb.addEventListener("click", e=>{ if(e.target.id==="addBackdrop") e.target.classList.add("hidden"); });
    const cs=$("#clearSampleBtn"); if(cs) cs.addEventListener("click", ()=>{
      const sc2 = sampleCounts();
      if(sc2.leads + sc2.maps + sc2.fb === 0){ alert("No sample data left to clear."); return; }
      if(!confirm("Clear ALL sample data (" + sc2.leads + " sample leads, " + sc2.maps + " sample Maps businesses, " + sc2.fb + " sample Facebook businesses)? Real leads you added will stay.")) return;
      leads=leads.filter(l=>!l.sample);
      mapsBusinesses=mapsBusinesses.filter(b=>!b.sample);
      fbBusinesses=fbBusinesses.filter(b=>!b.sample);
      save(); saveMaps(); saveFb();
      logEvent("Sample data", "Cleared all sample data (" + sc2.leads + " leads, " + sc2.maps + " Maps, " + sc2.fb + " Facebook)", 0);
      render();
    });
    const af=$("#addForm"); if(af) af.addEventListener("submit", e=>{
      e.preventDefault(); const f=new FormData(e.target);
      const website=String(f.get("website")||"").trim();
      if(website && !isRealUrl(website)){ alert("That website link does not look like a real https:// URL — it was left blank. Use a real site link, or leave it empty."); }
      const linkedinUrl=String(f.get("linkedinUrl")||"").trim(), facebookUrl=String(f.get("facebookUrl")||"").trim();
      const l=sanitize({id:nextId(leads), name:f.get("name"), role:f.get("role"), company:f.get("company"), website:isRealUrl(website)?website:"", email:f.get("email")||"", phone:f.get("phone")||"", location:f.get("location")||"", source:f.get("source"), intent:f.get("intent"), industry:f.get("industry")||"—", match:75, want:f.get("want"), lookingFor:f.get("want"), problems:(f.get("problems")||"").split("\n").filter(Boolean), urgency:"—", group:"Manual entry", postDate:"2026-11-27", status:"New", notes:"", sample:false, audit:null, linkedinUrl:isProfileUrl(linkedinUrl,"linkedin.com")?linkedinUrl:"", facebookUrl:isProfileUrl(facebookUrl,"facebook.com")?facebookUrl:"", upworkUrl:"", redditUrl:"", xUrl:"", behanceUrl:"", dribbbleUrl:"", outreach:""});
      if(l.email && leads.some(x=>x.email && x.email.toLowerCase()===l.email.toLowerCase())){ alert("Duplicate — a lead with this email already exists."); return; }
      l.outreach = generateOutreach(l); // complete draft with a closing question, not a truncated sentence
      leads.unshift(l); save();
      logEvent("Add Lead", "Lead added: " + l.name + " (" + l.company + ", " + l.source + ")", 1);
      e.target.reset(); $("#addBackdrop").classList.add("hidden"); go("leads");
    });
    render();
  });
}
