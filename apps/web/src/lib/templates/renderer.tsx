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

  const avgLum =
    backgroundColors
      .map((c) => {
        const rgb = hexToRgb(c);
        return rgb ? relativeLuminance(rgb) : 0.5;
      })
      .reduce((a, b) => a + b, 0) / Math.max(backgroundColors.length, 1);
  const isDarkBg = avgLum < 0.5;

  const overlayColor = isDarkBg ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const overlayStrong = isDarkBg ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)';

  if (type === 'none') return null;

  if (type === 'top-bar') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: W,
          height: 10,
          background: accent,
        }}
      />
    );
  }

  if (type === 'dual-circles') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: -200,
            right: -200,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: overlayColor,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -320,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: overlayStrong,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -180,
            left: -180,
            width: 440,
            height: 440,
            borderRadius: '50%',
            background: overlayColor,
          }}
        />
      </>
    );
  }

  if (type === 'corner-accent') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 40,
          width: 60,
          height: 60,
          borderTop: `2px solid ${accent}`,
          borderRight: `2px solid ${accent}`,
        }}
      />
    );
  }

  if (type === 'thin-rule') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 60,
          right: 60,
          height: 1,
          background: overlayStrong,
        }}
      />
    );
  }

  if (type === 'grain') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: W,
          height: H,
          backgroundImage: `radial-gradient(${overlayColor} 1px, transparent 1px)`,
          backgroundSize: '18px 18px',
          opacity: 0.6,
        }}
      />
    );
  }

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
            background: overlayColor,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 160,
            width: 4,
            height: H,
            background: accent,
            opacity: 0.7,
          }}
        />
      </>
    );
  }

  if (type === 'dots-grid') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: W,
          height: H,
          backgroundImage: `radial-gradient(${accent}20 1.2px, transparent 1.2px)`,
          backgroundSize: '40px 40px',
        }}
      />
    );
  }

  if (type === 'corner-blobs') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -180,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: overlayColor,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -220,
            left: -220,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: overlayColor,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 120,
            left: 80,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: overlayStrong,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 78,
            left: 140,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: overlayStrong,
          }}
        />
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