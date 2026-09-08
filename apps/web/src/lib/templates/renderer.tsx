// apps/web/src/lib/templates/renderer.ts
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { TEMPLATES, TemplateDefinition } from './index';

export interface BrandedImageRecipe {
  templateId: string;
  companyName: string;
  logoUrl: string;
  website?: string;
  socialLinks?: string[];
  brandColors?: Record<string, string>;
  fontStyle?: string;
  logoPosition?: 'top' | 'center' | 'bottom';
  showWebsite?: boolean;
  showHandles?: boolean;
  holidayName?: string;
  holidayDate?: string;
  holidayMessage?: string;
}

function getTemplate(templateId: string): TemplateDefinition {
  return TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
}

export async function renderBrandedImage(recipe: BrandedImageRecipe): Promise<Buffer> {
  const template = getTemplate(recipe.templateId);
  const logoPosition = recipe.logoPosition || template.logoPosition;
  const showWebsite = recipe.showWebsite ?? template.showWebsite;
  const showHandles = recipe.showHandles ?? template.showHandles;
  const fontStyle = recipe.fontStyle || template.fontFamily;

  // Build background style
  const backgroundStyle: React.CSSProperties = template.background.type === 'gradient'
    ? {
        backgroundImage: `linear-gradient(${template.background.angle || 135}deg, ${template.background.colors.join(', ')})`,
        color: template.textColor,
      }
    : {
        background: template.background.colors[0],
        color: template.textColor,
      };

  // Build JSX for Satori
  const element = (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        fontFamily: fontStyle,
        ...backgroundStyle,
      }}
    >
      {/* Logo */}
      {recipe.logoUrl && (
        <img
          src={recipe.logoUrl}
          alt="Logo"
          style={{
            width: 180,
            height: 180,
            objectFit: 'contain',
            marginBottom: 30,
          }}
        />
      )}

      {/* Company Name */}
      <h1 style={{ fontSize: template.companyNameSize, fontWeight: 'bold', margin: 0, textAlign: 'center' }}>
        {recipe.companyName}
      </h1>

      {/* Holiday overlay if present */}
      {recipe.holidayName && (
        <div style={{ fontSize: 32, marginTop: 10, textAlign: 'center' }}>
          {recipe.holidayMessage || `Happy ${recipe.holidayName}!`}
          {recipe.holidayDate && <span style={{ fontSize: 24, opacity: 0.8, display: 'block', marginTop: 5 }}>{recipe.holidayDate}</span>}
        </div>
      )}

      {/* Website */}
      {showWebsite && recipe.website && (
        <p style={{ fontSize: template.websiteSize, margin: '15px 0 0', opacity: 0.9, textAlign: 'center' }}>
          {recipe.website}
        </p>
      )}

      {/* Social handles */}
      {showHandles && recipe.socialLinks && recipe.socialLinks.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 15, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1000 }}>
          {recipe.socialLinks.map((handle, i) => (
            <span key={i} style={{ fontSize: 20, opacity: 0.85 }}>{handle}</span>
          ))}
        </div>
      )}
    </div>
  );

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [], // Optionally load custom fonts; for now use system default
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Final optimization with sharp
  const finalBuffer = await sharp(pngBuffer).resize(1200, 630).png().toBuffer();
  return finalBuffer;
}