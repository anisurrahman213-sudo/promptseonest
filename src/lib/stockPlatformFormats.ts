 // Stock platform export format configurations with official CSV guidelines
 // Each platform follows their specific column names and requirements

export type ExportFormat = 
  | 'adobe_stock' 
  | 'shutterstock' 
  | 'istock' 
  | 'getty_images' 
  | 'alamy' 
  | 'dreamstime' 
  | '123rf' 
  | 'depositphotos' 
  | 'canva_creators' 
  | 'freepik' 
  | 'vecteezy' 
  | 'picfair' 
  | 'eyeem' 
  | 'rawpixel' 
  | 'stocksy' 
  | 'twenty20' 
   | 'pond5'
   | 'wirestock'
   | 'generic'
   | 'storyblocks';

export interface StockPlatform {
  id: ExportFormat;
  name: string;
  description: string;
  icon: string;
  maxKeywords: number;
  maxTitleLength: number;
  maxDescriptionLength: number;
   csvColumns: string[];
   guidelines: string;
}

export const stockPlatforms: StockPlatform[] = [
  {
    id: 'adobe_stock',
    name: 'Adobe Stock',
    description: 'Filename, Title, Keywords (max 49), Category, Releases',
    icon: '🅰️',
    maxKeywords: 49,
    maxTitleLength: 200,
    maxDescriptionLength: 0,
    csvColumns: ['Filename', 'Title', 'Keywords', 'Category', 'Releases'],
    guidelines: 'Adobe Stock CSV Format:\n• Filename: Full name with extension (image.jpg, video.mov)\n• Title: Short description (max 200 characters)\n• Keywords: Comma-separated, max 49, ordered by relevance\n• Category: Numeric code (1-21)\n• Releases: Model/Property release names\n\nIMPORTANT:\n• Column names must match exactly in English\n• CSV max 5000 rows or 5MB\n• Upload images FIRST, then CSV\n• Filename must match exactly',
  },
  {
    id: 'shutterstock',
    name: 'Shutterstock',
    description: 'Filename, Description, Keywords (max 50), Category, Editorial',
    icon: '📷',
    maxKeywords: 50,
    maxTitleLength: 200,
    maxDescriptionLength: 200,
    csvColumns: ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial', 'Mature Content', 'Illustration'],
    guidelines: 'Shutterstock uses Description (not Title). Keywords comma-separated. Categories 1-2 numbers. Editorial: yes/no. Max 50 keywords.',
  },
  {
    id: 'istock',
    name: 'iStock / Getty',
     description: 'Filename, Title, Description, Keywords (max 50), Brief Code, Country, Created Date',
    icon: '📸',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
     csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'Brief Code', 'Country', 'Created Date'],
     guidelines: 'Use with DeepMeta software. Brief Code for assignment submissions. Created Date in YYYY-MM-DD format. Keywords comma-separated.',
  },
  {
    id: 'getty_images',
    name: 'Getty Images',
     description: 'Filename, Headline, Caption, Keywords (max 50), PersonInImage, DateCreated',
    icon: '🖼️',
    maxKeywords: 50,
    maxTitleLength: 250,
    maxDescriptionLength: 2000,
     csvColumns: ['Filename', 'Headline', 'Caption', 'Keywords', 'PersonInImage', 'DateCreated', 'City', 'Country'],
     guidelines: 'Getty uses Headline (not Title) and Caption (not Description). DateCreated in YYYY-MM-DD format. PersonInImage for model names. Supports location metadata.',
  },
  {
    id: 'alamy',
    name: 'Alamy',
     description: 'Filename, Caption, Tags (comma-separated), Supertags, Pseudonym, Date Taken',
    icon: '🌍',
    maxKeywords: 50,
    maxTitleLength: 255,
    maxDescriptionLength: 255,
     csvColumns: ['Filename', 'Caption', 'Tags', 'Supertags', 'Pseudonym', 'Date Taken', 'Exclusive', 'Model Release', 'Property Release'],
     guidelines: 'Alamy requires contacting support for CSV template. Caption is main description. Supertags are primary 2-3 keywords. Tags comma-separated. Exclusive: Yes/No.',
  },
  {
    id: 'dreamstime',
    name: 'Dreamstime',
     description: 'Filename, Title, Description, Keywords, Categories, Submission Type, Model Release ID',
    icon: '💭',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
     csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'Categories', 'W-EL', 'P-EL', 'SR-EL', 'Submission Type', 'MR-ID'],
     guidelines: 'Dreamstime FTP upload. W-EL/P-EL/SR-EL are extended license flags (0/1). Categories: numeric code. MR-ID: Model Release ID from MR Library. Submission Type: RF/Editorial.',
  },
  {
    id: '123rf',
    name: '123RF',
     description: 'Filename, Description, Keywords (max 50), Category',
    icon: '🔢',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
     csvColumns: ['Filename', 'Description', 'Keywords', 'Category'],
     guidelines: '123RF accepts embedded IPTC metadata. CSV optional. Description serves as title. Keywords comma-separated.',
  },
  {
    id: 'depositphotos',
    name: 'Depositphotos',
     description: 'Filename, Title, Description, Keywords (max 50), Category, Nudity',
    icon: '💎',
    maxKeywords: 50,
    maxTitleLength: 200,
    maxDescriptionLength: 200,
     csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'Nudity'],
     guidelines: 'Depositphotos reads IPTC metadata. CSV optional. Nudity flag for adult content. Keywords comma-separated.',
  },
  {
    id: 'canva_creators',
    name: 'Canva Creators',
     description: 'Filename, Title, Tags (max 25), Category, Content Type',
    icon: '🎨',
    maxKeywords: 25,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
     csvColumns: ['Filename', 'Title', 'Tags', 'Category', 'Content Type'],
     guidelines: 'Canva Creators portal. Tags max 25. Content Type: Photo/Illustration/Video. Category from Canva list.',
  },
  {
    id: 'freepik',
    name: 'Freepik Contributor',
     description: 'Filename, Title, Tags, Type, License',
    icon: '🎭',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
     csvColumns: ['Filename', 'Title', 'Tags', 'Type', 'License'],
     guidelines: 'Freepik accepts photos and vectors. Type: photo/vector/psd. License: free/premium. Tags space-separated.',
  },
  {
    id: 'vecteezy',
    name: 'Vecteezy',
     description: 'Filename, Title, Description, Tags (max 40), Category, Type',
    icon: '✏️',
    maxKeywords: 40,
    maxTitleLength: 100,
    maxDescriptionLength: 500,
     csvColumns: ['Filename', 'Title', 'Description', 'Tags', 'Category', 'Type'],
     guidelines: 'Vecteezy supports CSV upload from Add Data page. Tags comma-separated max 40. Type: Vector/Photo/Video.',
  },
  {
    id: 'picfair',
    name: 'Picfair',
     description: 'Filename, Title, Description, Tags (max 30), Location, Price',
    icon: '📱',
    maxKeywords: 30,
    maxTitleLength: 140,
    maxDescriptionLength: 500,
     csvColumns: ['Filename', 'Title', 'Description', 'Tags', 'Location', 'Price'],
     guidelines: 'Picfair allows custom pricing. Location optional. Tags max 30 comma-separated.',
  },
  {
    id: 'eyeem',
    name: 'EyeEm',
     description: 'Filename, Caption, Tags (max 30), Location',
    icon: '👁️',
    maxKeywords: 30,
    maxTitleLength: 140,
    maxDescriptionLength: 300,
     csvColumns: ['Filename', 'Caption', 'Tags', 'Location'],
     guidelines: 'EyeEm uses Caption (not Title/Description). Tags max 30. Location optional.',
  },
  {
    id: 'rawpixel',
    name: 'Rawpixel',
     description: 'Filename, Title, Description, Keywords (max 50), Category, License Type',
    icon: '🌈',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 300,
     csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'License Type'],
     guidelines: 'Rawpixel supports free and premium content. License Type: free/premium. Keywords comma-separated.',
  },
  {
    id: 'stocksy',
    name: 'Stocksy',
     description: 'Filename, Title, Caption, Keywords (max 50), Model Release, Property Release',
    icon: '⭐',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
     csvColumns: ['Filename', 'Title', 'Caption', 'Keywords', 'Model Release', 'Property Release'],
     guidelines: 'Stocksy curated marketplace. Caption max 200 chars. Keywords max 50. Release status: None/Attached.',
  },
  {
    id: 'twenty20',
    name: 'Twenty20',
     description: 'Filename, Description, Tags (max 25), Category',
    icon: '2️⃣',
    maxKeywords: 25,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
     csvColumns: ['Filename', 'Description', 'Tags', 'Category'],
     guidelines: 'Twenty20 (now Envato Elements). Tags max 25 comma-separated.',
   },
   {
     id: 'pond5',
     name: 'Pond5',
     description: 'Filename, Title, Description, Keywords, Category, Editorial, FPS, Codec',
     icon: '🎬',
     maxKeywords: 50,
     maxTitleLength: 100,
     maxDescriptionLength: 500,
     csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'Editorial', 'FPS', 'Codec', 'Price'],
     guidelines: 'Pond5 specializes in video. Supports custom pricing. FPS and Codec for video metadata. Editorial: yes/no.',
  },
  {
    id: 'wirestock',
    name: 'Wirestock',
     description: 'Filename, Title, Description, Keywords (max 50), Category, Content Type',
    icon: '🔌',
    maxKeywords: 50,
    maxTitleLength: 200,
    maxDescriptionLength: 500,
     csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'Content Type'],
     guidelines: 'Wirestock distributes to multiple platforms. Content Type: Photo/Video/Vector/Illustration.',
  },
   {
     id: 'storyblocks',
     name: 'Storyblocks',
     description: 'Filename, Title, Description, Keywords, Category, Editorial',
     icon: '📹',
     maxKeywords: 50,
     maxTitleLength: 100,
     maxDescriptionLength: 300,
     csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'Editorial'],
     guidelines: 'Storyblocks focuses on video and audio. Keywords comma-separated. Editorial: yes/no.',
   },
  {
    id: 'generic',
    name: 'Generic (All Fields)',
     description: 'All metadata fields for universal compatibility',
    icon: '📋',
    maxKeywords: 100,
    maxTitleLength: 200,
    maxDescriptionLength: 500,
     csvColumns: ['Filename', 'Title', 'Description', 'Keywords', 'AI Prompt', 'Created At', 'Category'],
     guidelines: 'Generic format with all common fields. Use for custom workflows or unsupported platforms.',
  },
];

export interface Generation {
  id: string;
  image_name: string;
  image_url: string;
  prompt: string;
  title: string;
  description: string;
  tags: string;
  created_at: string;
  category?: string;
  is_editorial?: boolean;
}

const escapeCSV = (text: string): string => {
  if (!text) return '""';
  return `"${text.replace(/"/g, '""')}"`;
};

 // Adobe Stock category number mapping
 // Official categories from: https://helpx.adobe.com/stock/contributor/help/categories.html
 const adobeStockCategoryMap: Record<string, string> = {
   'Animals': '1',
   'Animals/Wildlife': '1',
   'Buildings and Architecture': '2',
   'Architecture': '2',
   'Buildings/Landmarks': '2',
   'Business': '3',
   'Drinks': '4',
   'Food and Drink': '4',
   'Environment': '5',
   'The Environment': '5',
   'Nature': '5',
   'States of Mind': '6',
   'Feelings and Emotions': '6',
   'Food': '7',
   'Graphic Resources': '8',
   'Backgrounds/Textures': '8',
   'Abstract': '8',
   'Hobbies and Leisure': '9',
   'Parks/Outdoor': '9',
   'Industry': '10',
   'Industrial': '10',
   'Landscape': '11',
   'Lifestyle': '12',
   'People': '13',
   'Plants and Flowers': '14',
   'Culture and Religion': '15',
   'Religion': '15',
   'Science': '16',
   'Healthcare/Medical': '16',
   'Social Issues': '17',
   'Editorial': '17',
   'Sports': '18',
   'Sports/Recreation': '18',
   'Technology': '19',
   'Transport': '20',
   'Transportation': '20',
   'Travel': '21',
   'Beauty/Fashion': '12',
   'Arts': '8',
   'Celebrities': '17',
   'Education': '3',
   'Holidays': '9',
   'Interiors': '2',
   'Landmarks': '2',
   'Miscellaneous': '8',
   'Objects': '8',
   'Signs/Symbols': '8',
   'Vintage': '8',
   'Illustrations/Clip-Art': '8',
   'Vectors': '8',
 };
 
 const getAdobeStockCategoryNumber = (category: string): string => {
   if (!category) return '';
   // Check direct mapping
   if (adobeStockCategoryMap[category]) {
     return adobeStockCategoryMap[category];
   }
   // Try partial match
   const lowerCategory = category.toLowerCase();
   for (const [key, value] of Object.entries(adobeStockCategoryMap)) {
     if (key.toLowerCase().includes(lowerCategory) || lowerCategory.includes(key.toLowerCase())) {
       return value;
     }
   }
   // Default to Graphic Resources (8) if no match
   return '8';
 };
 
const limitKeywords = (tags: string, limit: number): string => {
  const keywords = tags.split(',').map(t => t.trim()).filter(Boolean);
  return keywords.slice(0, limit).join(', ');
};

const limitText = (text: string, limit: number): string => {
  if (!text) return '';
  return text.slice(0, limit);
};

export interface ExportResult {
  headers: string[];
  rows: string[][];
  filename: string;
}

export interface ExportOptions {
  overrideCategory?: string;
  editorialStatus?: 'none' | 'editorial' | 'commercial';
}

const getEditorialValue = (status: string, format: 'yesno' | 'rf' | 'creative'): string => {
  if (status === 'none') return '';
  if (format === 'yesno') {
    return status === 'editorial' ? 'yes' : 'no';
  }
  if (format === 'rf') {
    return status === 'editorial' ? 'Editorial' : 'RF';
  }
  if (format === 'creative') {
    return status === 'editorial' ? 'editorial' : 'creative';
  }
  return '';
};

const getCategoryValue = (generationCategory: string, overrideCategory?: string): string => {
  // If override is provided and not 'none', use it; otherwise use AI-generated category
  if (overrideCategory && overrideCategory !== 'none') {
    return overrideCategory;
  }
  if (!generationCategory || generationCategory === 'none' || generationCategory === '') {
    return '';
  }
  return generationCategory;
};

export const generateExport = (format: ExportFormat, generations: Generation[], options?: ExportOptions): ExportResult => {
  const overrideCategory = options?.overrideCategory;
  const editorialStatus = options?.editorialStatus || 'none';

  switch (format) {
    case 'adobe_stock':
      // Adobe Stock Official CSV Format (2024 Updated)
      // Reference: https://helpx.adobe.com/stock/contributor/help/keywording.html
      // Filename: Full name with extension (image.jpg, video.mov)
      // Title: Short description, max 200 characters
      // Keywords: Comma-separated, max 49, ordered by relevance
      // Category: Numeric code (1-21)
      // Releases: Model/Property release names
      return {
        headers: ['Filename', 'Title', 'Keywords', 'Category', 'Releases'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 200)),
          escapeCSV(limitKeywords(g.tags, 49)),
          escapeCSV(getAdobeStockCategoryNumber(getCategoryValue(g.category || '', overrideCategory))),
          escapeCSV(''),
        ]),
        filename: 'adobe-stock-metadata',
      };

    case 'shutterstock':
       // Shutterstock Official Format: Filename, Description, Keywords, Categories, Editorial
       // Description max 200, Keywords max 50 comma-separated
      return {
        headers: ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
          escapeCSV(getEditorialValue(editorialStatus, 'yesno')),
        ]),
        filename: 'shutterstock-export',
      };

    case 'istock':
       // iStock/Getty Official Format via DeepMeta
       // Includes Brief Code, Country, Created Date
      return {
         headers: ['Filename', 'Title', 'Description', 'Keywords', 'Brief Code', 'Country', 'Created Date'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
           escapeCSV(''),
           escapeCSV(''),
           escapeCSV(new Date(g.created_at).toISOString().split('T')[0]),
        ]),
        filename: 'istock-export',
      };

    case 'getty_images':
       // Getty Images Official Format
       // Uses Headline and Caption terminology
      return {
         headers: ['Filename', 'Headline', 'Caption', 'Keywords', 'PersonInImage', 'DateCreated', 'City', 'Country'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 250)),
          escapeCSV(limitText(g.description, 2000)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(''),
          escapeCSV(new Date(g.created_at).toISOString().split('T')[0]),
           escapeCSV(''),
           escapeCSV(''),
        ]),
        filename: 'getty-images-export',
      };

    case 'alamy':
       // Alamy Official Format
       // Includes Supertags (primary 2-3 keywords)
      return {
         headers: ['Filename', 'Caption', 'Tags', 'Supertags', 'Pseudonym', 'Date Taken', 'Exclusive', 'Model Release', 'Property Release'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.description, 255)),
          escapeCSV(limitKeywords(g.tags, 50)),
           escapeCSV(limitKeywords(g.tags, 3)),
           escapeCSV(''),
           escapeCSV(new Date(g.created_at).toISOString().split('T')[0]),
          escapeCSV(''),
          escapeCSV('No'),
          escapeCSV('No'),
        ]),
        filename: 'alamy-export',
      };

    case 'dreamstime':
       // Dreamstime Official Format via FTP
       // W-EL, P-EL, SR-EL are extended license flags
      return {
         headers: ['Filename', 'Title', 'Description', 'Keywords', 'Categories', 'W-EL', 'P-EL', 'SR-EL', 'Submission Type', 'MR-ID'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
           escapeCSV('1'),
           escapeCSV('1'),
           escapeCSV('1'),
           escapeCSV(getEditorialValue(editorialStatus, 'rf') || 'RF'),
           escapeCSV(''),
        ]),
        filename: 'dreamstime-export',
      };

    case '123rf':
       // 123RF Format
      return {
         headers: ['Filename', 'Description', 'Keywords', 'Category'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
           escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
        ]),
        filename: '123rf-export',
      };

    case 'depositphotos':
       // Depositphotos Format
      return {
         headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'Nudity'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 200)),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
           escapeCSV('no'),
        ]),
        filename: 'depositphotos-export',
      };

    case 'canva_creators':
       // Canva Creators Format
      return {
        headers: ['Filename', 'Title', 'Tags', 'Category', 'ContentType'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitKeywords(g.tags, 25)),
          escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
          escapeCSV('Photo'),
        ]),
        filename: 'canva-creators-export',
      };

    case 'freepik':
       // Freepik Format - Tags are space-separated
      return {
         headers: ['Filename', 'Title', 'Tags', 'Type', 'License'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
           escapeCSV(g.tags.split(',').map(t => t.trim()).join(' ')),
          escapeCSV('photo'),
           escapeCSV('premium'),
        ]),
        filename: 'freepik-export',
      };

    case 'vecteezy':
       // Vecteezy Format
      return {
         headers: ['Filename', 'Title', 'Description', 'Tags', 'Category', 'Type'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitText(g.description, 500)),
          escapeCSV(limitKeywords(g.tags, 40)),
           escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
           escapeCSV('Photo'),
        ]),
        filename: 'vecteezy-export',
      };

    case 'picfair':
       // Picfair Format
      return {
         headers: ['Filename', 'Title', 'Description', 'Tags', 'Location', 'Price'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 140)),
          escapeCSV(limitText(g.description, 500)),
          escapeCSV(limitKeywords(g.tags, 30)),
          escapeCSV(''),
           escapeCSV(''),
        ]),
        filename: 'picfair-export',
      };

    case 'eyeem':
       // EyeEm Format - Uses Caption
      return {
         headers: ['Filename', 'Caption', 'Tags', 'Location'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.description, 300)),
          escapeCSV(limitKeywords(g.tags, 30)),
           escapeCSV(''),
        ]),
        filename: 'eyeem-export',
      };

    case 'rawpixel':
       // Rawpixel Format
      return {
         headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'License Type'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitText(g.description, 300)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
           escapeCSV('premium'),
        ]),
        filename: 'rawpixel-export',
      };

    case 'stocksy':
       // Stocksy Format
      return {
         headers: ['Filename', 'Title', 'Caption', 'Keywords', 'Model Release', 'Property Release'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV('None'),
          escapeCSV('None'),
        ]),
        filename: 'stocksy-export',
      };

    case 'twenty20':
       // Twenty20/Envato Format
      return {
         headers: ['Filename', 'Description', 'Tags', 'Category'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 25)),
           escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
        ]),
        filename: 'twenty20-export',
      };

     case 'pond5':
       // Pond5 Official Format - Video-focused
       return {
         headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'Editorial', 'FPS', 'Codec', 'Price'],
         rows: generations.map(g => [
           escapeCSV(g.image_name),
           escapeCSV(limitText(g.title, 100)),
           escapeCSV(limitText(g.description, 500)),
           escapeCSV(limitKeywords(g.tags, 50)),
           escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
           escapeCSV(getEditorialValue(editorialStatus, 'yesno')),
           escapeCSV(''),
           escapeCSV(''),
           escapeCSV(''),
         ]),
         filename: 'pond5-export',
       };
 
    case 'wirestock':
       // Wirestock Format
      return {
        headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'ContentType'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 200)),
          escapeCSV(limitText(g.description, 500)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
          escapeCSV('Photo'),
        ]),
        filename: 'wirestock-export',
      };

     case 'storyblocks':
       // Storyblocks Format
       return {
         headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'Editorial'],
         rows: generations.map(g => [
           escapeCSV(g.image_name),
           escapeCSV(limitText(g.title, 100)),
           escapeCSV(limitText(g.description, 300)),
           escapeCSV(limitKeywords(g.tags, 50)),
           escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
           escapeCSV(getEditorialValue(editorialStatus, 'yesno')),
         ]),
         filename: 'storyblocks-export',
       };
 
    case 'generic':
    default:
       // Generic Format with all common fields
      return {
         headers: ['Filename', 'Title', 'Description', 'Keywords', 'AI Prompt', 'Created At', 'Category'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(g.title),
          escapeCSV(g.description),
          escapeCSV(g.tags),
          escapeCSV(g.prompt),
          escapeCSV(new Date(g.created_at).toISOString()),
           escapeCSV(getCategoryValue(g.category || '', overrideCategory)),
        ]),
        filename: 'metadata-export',
      };
  }
};
