// Stock platform export format configurations

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
  | 'wirestock'
  | 'generic';

export interface StockPlatform {
  id: ExportFormat;
  name: string;
  description: string;
  icon: string;
  maxKeywords: number;
  maxTitleLength: number;
  maxDescriptionLength: number;
}

export const stockPlatforms: StockPlatform[] = [
  {
    id: 'adobe_stock',
    name: 'Adobe Stock',
     description: 'Filename, Title (max 60), Description (max 200), Keywords (max 25)',
    icon: '🅰️',
    maxKeywords: 25,
    maxTitleLength: 60,
    maxDescriptionLength: 200,
  },
  {
    id: 'shutterstock',
    name: 'Shutterstock',
    description: 'Filename, Description (max 200), Keywords (max 50)',
    icon: '📷',
    maxKeywords: 50,
    maxTitleLength: 200,
    maxDescriptionLength: 200,
  },
  {
    id: 'istock',
    name: 'iStock / Getty',
    description: 'Filename, Title, Description, Keywords (max 50)',
    icon: '📸',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
  },
  {
    id: 'getty_images',
    name: 'Getty Images',
    description: 'Filename, Headline, Caption, Keywords (max 50)',
    icon: '🖼️',
    maxKeywords: 50,
    maxTitleLength: 250,
    maxDescriptionLength: 2000,
  },
  {
    id: 'alamy',
    name: 'Alamy',
    description: 'Filename, Caption, Tags (max 50), Category',
    icon: '🌍',
    maxKeywords: 50,
    maxTitleLength: 255,
    maxDescriptionLength: 255,
  },
  {
    id: 'dreamstime',
    name: 'Dreamstime',
    description: 'Filename, Title, Description, Keywords (max 50)',
    icon: '💭',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
  },
  {
    id: '123rf',
    name: '123RF',
    description: 'Filename, Description, Keywords (max 50)',
    icon: '🔢',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
  },
  {
    id: 'depositphotos',
    name: 'Depositphotos',
    description: 'Filename, Title, Description, Keywords (max 50)',
    icon: '💎',
    maxKeywords: 50,
    maxTitleLength: 200,
    maxDescriptionLength: 200,
  },
  {
    id: 'canva_creators',
    name: 'Canva Creators',
    description: 'Filename, Title, Tags (max 25), Category',
    icon: '🎨',
    maxKeywords: 25,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
  },
  {
    id: 'freepik',
    name: 'Freepik Contributor',
    description: 'Filename, Title, Tags, Type',
    icon: '🎭',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
  },
  {
    id: 'vecteezy',
    name: 'Vecteezy',
    description: 'Filename, Title, Description, Tags (max 40)',
    icon: '✏️',
    maxKeywords: 40,
    maxTitleLength: 100,
    maxDescriptionLength: 500,
  },
  {
    id: 'picfair',
    name: 'Picfair',
    description: 'Filename, Title, Description, Tags (max 30)',
    icon: '📱',
    maxKeywords: 30,
    maxTitleLength: 140,
    maxDescriptionLength: 500,
  },
  {
    id: 'eyeem',
    name: 'EyeEm',
    description: 'Filename, Caption, Tags (max 30)',
    icon: '👁️',
    maxKeywords: 30,
    maxTitleLength: 140,
    maxDescriptionLength: 300,
  },
  {
    id: 'rawpixel',
    name: 'Rawpixel',
    description: 'Filename, Title, Description, Keywords (max 50)',
    icon: '🌈',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 300,
  },
  {
    id: 'stocksy',
    name: 'Stocksy',
    description: 'Filename, Title, Caption, Keywords (max 50)',
    icon: '⭐',
    maxKeywords: 50,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
  },
  {
    id: 'twenty20',
    name: 'Twenty20',
    description: 'Filename, Description, Tags (max 25)',
    icon: '2️⃣',
    maxKeywords: 25,
    maxTitleLength: 100,
    maxDescriptionLength: 200,
  },
  {
    id: 'wirestock',
    name: 'Wirestock',
    description: 'Filename, Title, Description, Keywords (max 50)',
    icon: '🔌',
    maxKeywords: 50,
    maxTitleLength: 200,
    maxDescriptionLength: 500,
  },
  {
    id: 'generic',
    name: 'Generic (All Fields)',
    description: 'All metadata fields for custom use',
    icon: '📋',
    maxKeywords: 100,
    maxTitleLength: 200,
    maxDescriptionLength: 500,
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
}

const escapeCSV = (text: string): string => {
  if (!text) return '""';
  return `"${text.replace(/"/g, '""')}"`;
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

export const generateExport = (format: ExportFormat, generations: Generation[]): ExportResult => {
  switch (format) {
    case 'adobe_stock':
      return {
         headers: ['Filename', 'Title', 'Description', 'Keywords'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 60)),
           escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 25)),
        ]),
        filename: 'adobe-stock-export',
      };

    case 'shutterstock':
      return {
        headers: ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(''),
          escapeCSV('no'),
        ]),
        filename: 'shutterstock-export',
      };

    case 'istock':
      return {
        headers: ['Filename', 'Title', 'Description', 'Keywords'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
        ]),
        filename: 'istock-export',
      };

    case 'getty_images':
      return {
        headers: ['Filename', 'Headline', 'Caption', 'Keywords', 'PersonInImage', 'DateCreated'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 250)),
          escapeCSV(limitText(g.description, 2000)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(''),
          escapeCSV(new Date(g.created_at).toISOString().split('T')[0]),
        ]),
        filename: 'getty-images-export',
      };

    case 'alamy':
      return {
        headers: ['Filename', 'Caption', 'Tags', 'Category', 'Exclusive', 'ModelRelease', 'PropertyRelease'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.description, 255)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(''),
          escapeCSV('No'),
          escapeCSV('No'),
          escapeCSV('No'),
        ]),
        filename: 'alamy-export',
      };

    case 'dreamstime':
      return {
        headers: ['Filename', 'Title', 'Description', 'Keywords', 'Categories'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(''),
        ]),
        filename: 'dreamstime-export',
      };

    case '123rf':
      return {
        headers: ['Filename', 'Description', 'Keywords'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
        ]),
        filename: '123rf-export',
      };

    case 'depositphotos':
      return {
        headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 200)),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(''),
        ]),
        filename: 'depositphotos-export',
      };

    case 'canva_creators':
      return {
        headers: ['Filename', 'Title', 'Tags', 'Category', 'ContentType'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitKeywords(g.tags, 25)),
          escapeCSV(''),
          escapeCSV('Photo'),
        ]),
        filename: 'canva-creators-export',
      };

    case 'freepik':
      return {
        headers: ['Filename', 'Title', 'Tags', 'Type'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(g.tags),
          escapeCSV('photo'),
        ]),
        filename: 'freepik-export',
      };

    case 'vecteezy':
      return {
        headers: ['Filename', 'Title', 'Description', 'Tags'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitText(g.description, 500)),
          escapeCSV(limitKeywords(g.tags, 40)),
        ]),
        filename: 'vecteezy-export',
      };

    case 'picfair':
      return {
        headers: ['Filename', 'Title', 'Description', 'Tags', 'Location'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 140)),
          escapeCSV(limitText(g.description, 500)),
          escapeCSV(limitKeywords(g.tags, 30)),
          escapeCSV(''),
        ]),
        filename: 'picfair-export',
      };

    case 'eyeem':
      return {
        headers: ['Filename', 'Caption', 'Tags'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.description, 300)),
          escapeCSV(limitKeywords(g.tags, 30)),
        ]),
        filename: 'eyeem-export',
      };

    case 'rawpixel':
      return {
        headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 100)),
          escapeCSV(limitText(g.description, 300)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(''),
        ]),
        filename: 'rawpixel-export',
      };

    case 'stocksy':
      return {
        headers: ['Filename', 'Title', 'Caption', 'Keywords', 'ModelRelease', 'PropertyRelease'],
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
      return {
        headers: ['Filename', 'Description', 'Tags'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.description, 200)),
          escapeCSV(limitKeywords(g.tags, 25)),
        ]),
        filename: 'twenty20-export',
      };

    case 'wirestock':
      return {
        headers: ['Filename', 'Title', 'Description', 'Keywords', 'Category', 'ContentType'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(limitText(g.title, 200)),
          escapeCSV(limitText(g.description, 500)),
          escapeCSV(limitKeywords(g.tags, 50)),
          escapeCSV(''),
          escapeCSV('Photo'),
        ]),
        filename: 'wirestock-export',
      };

    case 'generic':
    default:
      return {
        headers: ['Filename', 'Title', 'Description', 'Keywords', 'AI Prompt', 'Created At'],
        rows: generations.map(g => [
          escapeCSV(g.image_name),
          escapeCSV(g.title),
          escapeCSV(g.description),
          escapeCSV(g.tags),
          escapeCSV(g.prompt),
          escapeCSV(new Date(g.created_at).toISOString()),
        ]),
        filename: 'metadata-export',
      };
  }
};
