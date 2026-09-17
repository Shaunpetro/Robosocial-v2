// apps/web/src/lib/templates/renderer.tsx
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { TEMPLATES, TemplateDefinition, DecorationType } from './index';
import { PLATFORMS, CONTACT } from './icons';
import {
  pickHolidayColor,
  ensureAccentContrast,
  hexToRgb,
  relativeLuminance,
} from './colors';

export interface SocialItem {
  platform: string;
  handle: string;
}

export interface BrandedImageRecipe {
  templateId: string;
  companyName: string;
  logoUrl: string;
  logoHasTransparency?: boolean;
  tagline?: string | null;
  dedication?: string | null;
  website?: string;
  socialItems?: SocialItem[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  brandColors?: Record<string, string>;
  logoPosition?: 'top' | 'center' | 'bottom';
  showWebsite?: boolean;
  showHandles?: boolean;
  holidayName?: string;
  holidayDate?: string;
  holidayMessage?: string;
  companyId?: string;
  baseFontData: ArrayBuffer;
  holidayFontData: ArrayBuffer;
  holidayFontName: string;
}

function getTemplate(templateId: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
}

function LogoElement({
  logoUrl,
  hasTransparency,
  size = 100,
}: {
  logoUrl: string;
  hasTransparency: boolean;
  size?: number;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  const img = (
    <img
      src={logoUrl}
      alt="Logo"
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );

  if (hasTransparency) return img;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size + 32,
        height: size + 32,
        background: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
      }}
    >
      {img}
    </div>
  );
}

interface Badge {
  iconUri: string;
  color: string;
  text: string;
}

function ContactBadge({ badge }: { badge: Badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
          background: '#FFFFFF',
          borderRadius: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 8,
            background: badge.color,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badge.iconUri} alt="" style={{ width: 15, height: 15 }} />
        </div>
      </div>
      <span style={{ fontSize: 16, opacity: 0.9 }}>{badge.text}</span>
    </div>
  );
}

function DecorationLayer({
  type,
  accent,
  backgroundColors,
}: {
  type: DecorationType;
  accent: string;
  backgroundColors: string[];
}) {
  const W = 1200;
  const H = 630;

  // Determine whether background is dark so we can choose light or dark accents
  const avgLum =
    backgroundColors
      .map((c) => {
        const rgb = hexToRgb(c);
        return rgb ? relativeLuminance(rgb) : 0.5;
      })
      .reduce((a, b) => a + b, 0) / Math.max(backgroundColors.length, 1);
  const isDarkBg = avgLum < 0.5;

  if (type === 'none') return null;

  // Clean Corporate: solid brand bar plus soft gradient strip beneath
  if (type === 'top-bar') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: 14,
            background: accent,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 0,
            width: W,
            height: 60,
            backgroundImage: `linear-gradient(180deg, ${accent}26 0%, ${accent}00 100%)`,
          }}
        />
      </>
    );
  }

  // Bold Gradient: two radial gradient circles plus a solid accent dot
  if (type === 'dual-circles') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -180,
            width: 500,
            height: 500,
            borderRadius: '50%',
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: -100,
            width: 320,
            height: 320,
            borderRadius: '50%',
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 80,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: accent,
            opacity: 0.5,
          }}
        />
      </>
    );
  }

  // Minimalist Dark: mirrored corner brackets
  if (type === 'corner-accent') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            width: 60,
            height: 60,
            borderTop: `3px solid ${accent}`,
            borderRight: `3px solid ${accent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            width: 60,
            height: 60,
            borderBottom: `3px solid ${accent}`,
            borderLeft: `3px solid ${accent}`,
          }}
        />
      </>
    );
  }

  // Professional Blue: top rule plus bottom accent band
  if (type === 'thin-rule') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 130,
            left: 60,
            right: 60,
            height: 2,
            background: 'rgba(255,255,255,0.40)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: W,
            height: 20,
            background: accent,
            opacity: 0.4,
          }}
        />
      </>
    );
  }

  // Earthy SA: bold dot pattern plus large soft wave bottom-left
  if (type === 'grain') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            backgroundImage: `radial-gradient(rgba(255,255,255,0.30) 2px, transparent 2px)`,
            backgroundSize: '20px 20px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -250,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 80,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.10)',
          }}
        />
      </>
    );
  }

  // Modern Split: darker right band plus thick divider plus accent square
  if (type === 'side-divider') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 160,
            height: H,
            background: 'rgba(0,0,0,0.20)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 160,
            width: 6,
            height: H,
            background: accent,
            opacity: 0.7,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            width: 60,
            height: 60,
            background: accent,
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 60,
            width: 40,
            height: 4,
            background: accent,
            opacity: 0.85,
          }}
        />
      </>
    );
  }

  // Tech Grid: denser dot pattern plus four corner brackets
  if (type === 'dots-grid') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            backgroundImage: `radial-gradient(${accent}55 1.5px, transparent 1.5px)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 30,
            width: 40,
            height: 40,
            borderTop: `2px solid ${accent}`,
            borderLeft: `2px solid ${accent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 30,
            right: 30,
            width: 40,
            height: 40,
            borderTop: `2px solid ${accent}`,
            borderRight: `2px solid ${accent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: 30,
            width: 40,
            height: 40,
            borderBottom: `2px solid ${accent}`,
            borderLeft: `2px solid ${accent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            width: 40,
            height: 40,
            borderBottom: `2px solid ${accent}`,
            borderRight: `2px solid ${accent}`,
          }}
        />
      </>
    );
  }

  // Playful: scattered confetti across the canvas
  if (type === 'corner-blobs') {
    const confetti: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      color: string;
    }> = [
      { x: 80, y: 80, size: 20, opacity: 0.45, color: accent },
      { x: 180, y: 160, size: 12, opacity: 0.35, color: '#FFFFFF' },
      { x: 1040, y: 100, size: 24, opacity: 0.40, color: accent },
      { x: 1120, y: 200, size: 14, opacity: 0.50, color: '#FFFFFF' },
      { x: 60, y: 500, size: 18, opacity: 0.40, color: '#FFFFFF' },
      { x: 180, y: 560, size: 10, opacity: 0.55, color: accent },
      { x: 1070, y: 520, size: 22, opacity: 0.35, color: accent },
      { x: 960, y: 570, size: 14, opacity: 0.45, color: '#FFFFFF' },
      { x: 400, y: 60, size: 10, opacity: 0.40, color: '#FFFFFF' },
      { x: 800, y: 70, size: 12, opacity: 0.35, color: accent },
      { x: 350, y: 580, size: 16, opacity: 0.40, color: accent },
      { x: 850, y: 590, size: 8, opacity: 0.45, color: '#FFFFFF' },
    ];

    return (
      <>
        {confetti.map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: c.y,
              left: c.x,
              width: c.size,
              height: c.size,
              borderRadius: '50%',
              background: c.color,
              opacity: c.opacity,
            }}
          />
        ))}
      </>
    );
  }

  return null;
}

export async function renderBrandedImage(recipe: BrandedImageRecipe): Promise<string> {
  const template = getTemplate(recipe.templateId);
  const showWebsite = recipe.showWebsite ?? template.showWebsite;
  const showHandles = recipe.showHandles ?? template.showHandles;
  const logoPosition = recipe.logoPosition || 'top';
  const hasHoliday = !!recipe.holidayName;
  const hasTransparency = recipe.logoHasTransparency ?? true;

  const bgColors = template.background.colors;

  const rawAccent = recipe.brandColors?.primary || template.textColor;
  const accentColor = ensureAccentContrast(rawAccent, bgColors, template.textColor);

  const seed = `${recipe.companyId || 'anon'}-${recipe.holidayName || 'base'}-${new Date().getFullYear()}`;
  const holidayColor =
    pickHolidayColor(recipe.holidayName, bgColors, seed) || template.textColor;

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

  const baseTextStyle: React.CSSProperties = {
    fontFamily: 'Inter',
  };

  const LogoBlock = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, ...baseTextStyle }}>
      <LogoElement logoUrl={recipe.logoUrl} hasTransparency={hasTransparency} size={110} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ width: 48, height: 3, background: accentColor, borderRadius: 2 }} />
        <div
          style={{
            fontSize: template.companyNameSize,
            fontWeight: 'bold',
            letterSpacing: 0.4,
          }}
        >
          {recipe.companyName}
        </div>
        {recipe.tagline && (
          <div
            style={{
              fontSize: template.taglineSize,
              opacity: 0.7,
              letterSpacing: 0.4,
              fontFamily: 'Inter',
            }}
          >
            {recipe.tagline}
          </div>
        )}
      </div>
    </div>
  );

  const HolidayBlock = hasHoliday ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: 84,
          fontFamily: recipe.holidayFontName,
          textAlign: 'center',
          lineHeight: 1.1,
          maxWidth: 1000,
          color: holidayColor,
        }}
      >
        {recipe.holidayMessage || `Happy ${recipe.holidayName}!`}
      </div>
      {recipe.holidayDate && (
        <div
          style={{
            fontSize: 26,
            opacity: 0.85,
            letterSpacing: 2,
            fontFamily: recipe.holidayFontName,
            color: holidayColor,
          }}
        >
          {recipe.holidayDate}
        </div>
      )}
      {recipe.dedication && (
        <div
          style={{
            fontSize: 18,
            opacity: 0.75,
            fontFamily: 'Inter',
            fontStyle: 'italic',
            marginTop: 8,
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          {recipe.dedication}
        </div>
      )}
    </div>
  ) : (
    <div style={{ flex: 1 }} />
  );

  const contactBadges: Badge[] = [];
  if (showWebsite && recipe.website) {
    contactBadges.push({
      iconUri: CONTACT.website.uri,
      color: CONTACT.website.color,
      text: recipe.website.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    });
  }
  if (recipe.contactEmail) {
    contactBadges.push({
      iconUri: CONTACT.email.uri,
      color: CONTACT.email.color,
      text: recipe.contactEmail,
    });
  }
  if (recipe.contactPhone) {
    contactBadges.push({
      iconUri: CONTACT.phone.uri,
      color: CONTACT.phone.color,
      text: recipe.contactPhone,
    });
  }
  if (recipe.contactWhatsapp) {
    contactBadges.push({
      iconUri: CONTACT.whatsapp.uri,
      color: CONTACT.whatsapp.color,
      text: recipe.contactWhatsapp,
    });
  }

  const socialBadges: Badge[] = [];
  if (showHandles && recipe.socialItems) {
    for (const item of recipe.socialItems) {
      const platform = PLATFORMS[item.platform];
      if (!platform) continue;
      socialBadges.push({
        iconUri: platform.uri,
        color: platform.color,
        text: item.handle,
      });
    }
  }

  const allBadges = [...contactBadges, ...socialBadges];

  const FooterBlock =
    allBadges.length > 0 ? (
      <div
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: 1080,
          ...baseTextStyle,
        }}
      >
        {allBadges.map((badge, i) => (
          <ContactBadge key={i} badge={badge} />
        ))}
      </div>
    ) : null;

  let contentLayout: React.ReactNode;

  if (logoPosition === 'center') {
    contentLayout = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: 50,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flex: 1 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            ...baseTextStyle,
          }}
        >
          <LogoElement logoUrl={recipe.logoUrl} hasTransparency={hasTransparency} size={140} />
          <div style={{ width: 64, height: 3, background: accentColor, borderRadius: 2 }} />
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{recipe.companyName}</div>
          {recipe.tagline && (
            <div style={{ fontSize: 14, opacity: 0.7, marginTop: -6 }}>
              {recipe.tagline}
            </div>
          )}
          {hasHoliday && (
            <div
              style={{
                fontSize: 52,
                fontFamily: recipe.holidayFontName,
                textAlign: 'center',
                marginTop: 16,
                color: holidayColor,
              }}
            >
              {recipe.holidayMessage || `Happy ${recipe.holidayName}!`}
            </div>
          )}
          {recipe.dedication && (
            <div
              style={{
                fontSize: 18,
                opacity: 0.75,
                fontStyle: 'italic',
                textAlign: 'center',
                maxWidth: 900,
                marginTop: 6,
              }}
            >
              {recipe.dedication}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flex: 1 }} />
        {FooterBlock}
      </div>
    );
  } else if (logoPosition === 'bottom') {
    contentLayout = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: 50,
          position: 'relative',
        }}
      >
        {HolidayBlock}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {LogoBlock}
          {FooterBlock}
        </div>
      </div>
    );
  } else {
    contentLayout = (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: 50,
          position: 'relative',
        }}
      >
        {LogoBlock}
        {HolidayBlock}
        {FooterBlock}
      </div>
    );
  }

  const composed = (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: 1200,
        height: 630,
        ...backgroundStyle,
      }}
    >
      <DecorationLayer
        type={template.decoration}
        accent={accentColor}
        backgroundColors={bgColors}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          width: 1200,
          height: 630,
          zIndex: 1,
        }}
      >
        {contentLayout}
      </div>
    </div>
  );

  const { default: satori } = await import('satori');

  const svg = await satori(composed, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: recipe.baseFontData,
        weight: 400,
        style: 'normal',
      },
      {
        name: recipe.holidayFontName,
        data: recipe.holidayFontData,
        weight: 400,
        style: 'normal',
      },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const finalBuffer = await sharp(pngBuffer).resize(1200, 630).png().toBuffer();
  return finalBuffer.toString('base64');
}