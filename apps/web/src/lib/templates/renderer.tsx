// apps/web/src/lib/templates/renderer.tsx
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { TEMPLATES, TemplateDefinition } from './index';

export interface BrandedImageRecipe {
  templateId: string;
  companyName: string;
  logoUrl: string;
  website?: string;
  socialLinks?: string[];
  logoPosition?: 'top' | 'center' | 'bottom';
  showWebsite?: boolean;
  showHandles?: boolean;
  holidayName?: string;
  holidayDate?: string;
  holidayMessage?: string;
  fontData: ArrayBuffer;
  fontName: string;
}

function getTemplate(templateId: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
}

export async function renderBrandedImage(recipe: BrandedImageRecipe): Promise<Buffer> {
  const template = getTemplate(recipe.templateId);
  const showWebsite = recipe.showWebsite ?? template.showWebsite;
  const showHandles = recipe.showHandles ?? template.showHandles;
  const logoPosition = recipe.logoPosition || 'top';
  const hasHoliday = !!recipe.holidayName;

  const backgroundStyle: React.CSSProperties =
    template.background.type === 'gradient'
      ? {
          backgroundImage: `linear-gradient(${template.background.angle || 135}deg, ${template.background.colors.join(', ')})`,
          color: template.textColor,
        }
      : {
          background: template.background.colors[0],
          color: template.textColor,
        };

  // -------- Logo block --------
  const LogoBlock = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      {recipe.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={recipe.logoUrl}
          alt="Logo"
          style={{ width: 100, height: 100, objectFit: 'contain' }}
        />
      )}
      <div
        style={{
          fontSize: 34,
          fontWeight: 'bold',
          letterSpacing: 1,
        }}
      >
        {recipe.companyName}
      </div>
    </div>
  );

  // -------- Holiday block --------
  const HolidayBlock = hasHoliday ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: 88,
          fontFamily: recipe.fontName,
          textAlign: 'center',
          lineHeight: 1.1,
          maxWidth: 1000,
        }}
      >
        {recipe.holidayMessage || `Happy ${recipe.holidayName}!`}
      </div>
      {recipe.holidayDate && (
        <div style={{ fontSize: 32, opacity: 0.85, letterSpacing: 2 }}>
          {recipe.holidayDate}
        </div>
      )}
    </div>
  ) : (
    <div style={{ flex: 1 }} />
  );

  // -------- Footer block --------
  const FooterBlock = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {showWebsite && recipe.website && (
        <div style={{ fontSize: 22, opacity: 0.9 }}>{recipe.website}</div>
      )}
      {showHandles && recipe.socialLinks && recipe.socialLinks.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 1000,
          }}
        >
          {recipe.socialLinks.map((handle, i) => (
            <span key={i} style={{ fontSize: 16, opacity: 0.75 }}>
              {handle}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // -------- Compose layout by logoPosition --------
  let children: React.ReactNode;

  if (logoPosition === 'center') {
    // Centered hero layout (best without holiday: logo becomes the star)
    children = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: 60,
          ...backgroundStyle,
        }}
      >
        <div style={{ display: 'flex', flex: 1 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 30,
          }}
        >
          {recipe.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.logoUrl}
              alt="Logo"
              style={{ width: 200, height: 200, objectFit: 'contain' }}
            />
          )}
          <div style={{ fontSize: 42, fontWeight: 'bold' }}>{recipe.companyName}</div>
          {hasHoliday && (
            <div
              style={{
                fontSize: 54,
                fontFamily: recipe.fontName,
                textAlign: 'center',
                marginTop: 20,
              }}
            >
              {recipe.holidayMessage || `Happy ${recipe.holidayName}!`}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flex: 1 }} />
        {FooterBlock}
      </div>
    );
  } else if (logoPosition === 'bottom') {
    children = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: 60,
          ...backgroundStyle,
        }}
      >
        {HolidayBlock}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {LogoBlock}
          {FooterBlock}
        </div>
      </div>
    );
  } else {
    // Default: top
    children = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: 60,
          ...backgroundStyle,
        }}
      >
        {LogoBlock}
        {HolidayBlock}
        {FooterBlock}
      </div>
    );
  }

  const { default: satori } = await import('satori');

  const svg = await satori(children, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: recipe.fontName,
        data: recipe.fontData,
        weight: 400,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return await sharp(pngBuffer).resize(1200, 630).png().toBuffer();
}