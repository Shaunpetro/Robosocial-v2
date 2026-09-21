// apps/web/src/lib/templates/renderer.tsx
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { TEMPLATES, TemplateDefinition, DecorationType } from './index';
import { PLATFORMS, CONTACT } from './icons';
import { getComposition } from './compositions';
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
  compositionId?: string | null;
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
  backgroundImageUrl?: string | null;
  baseFontData: ArrayBuffer;
  holidayFontData: ArrayBuffer;
  holidayFontName: string;
}

function getTemplate(templateId: string): TemplateDefinition {
  return TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
}

function pickReadableTextColor(bgHex: string): string {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return '#FFFFFF';
  const lum = relativeLuminance(rgb);
  return lum < 0.5 ? '#FFFFFF' : '#111827';
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
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt="Logo"
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );

  if (hasTransparency) {
    return (
      <div style={{ display: 'flex', flexDirection: 'row' }}>{img}</div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
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

function ContactBadge({
  badge,
  ringColor,
}: {
  badge: Badge;
  ringColor: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
          background: '#FFFFFF',
          borderRadius: 10,
          border: `2px solid ${ringColor}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 6,
            background: badge.color,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badge.iconUri} alt="" style={{ width: 13, height: 13 }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <span style={{ fontSize: 14, opacity: 0.95 }}>{badge.text}</span>
      </div>
    </div>
  );
}

function DecorationLayer({
  type,
  accent,
  backgroundColors,
  hasPhoto,
}: {
  type: DecorationType;
  accent: string;
  backgroundColors: string[];
  hasPhoto?: boolean;
}) {
  const W = 1200;
  const H = 630;

  const effectiveAccent = hasPhoto ? '#FFFFFF' : accent;
  const dotAlpha = hasPhoto ? 0.55 : 0.30;
  const circleAlpha = hasPhoto ? 0.55 : 0.30;
  const circleAlphaSoft = hasPhoto ? 0.40 : 0.22;

  if (type === 'none') return null;

  if (type === 'top-bar') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: 14,
            background: effectiveAccent,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 0,
            width: W,
            height: 60,
            backgroundImage: `linear-gradient(180deg, ${effectiveAccent}26 0%, ${effectiveAccent}00 100%)`,
          }}
        />
      </div>
    );
  }

  if (type === 'dual-circles') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -180,
            width: 500,
            height: 500,
            borderRadius: '50%',
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,${circleAlpha}) 0%, rgba(255,255,255,0) 70%)`,
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
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,${circleAlphaSoft}) 0%, rgba(255,255,255,0) 70%)`,
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
            background: effectiveAccent,
            opacity: hasPhoto ? 0.85 : 0.5,
          }}
        />
      </div>
    );
  }

  if (type === 'corner-accent') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            width: 60,
            height: 60,
            borderTop: `3px solid ${effectiveAccent}`,
            borderRight: `3px solid ${effectiveAccent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            width: 60,
            height: 60,
            borderBottom: `3px solid ${effectiveAccent}`,
            borderLeft: `3px solid ${effectiveAccent}`,
          }}
        />
      </div>
    );
  }

  if (type === 'thin-rule') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            position: 'absolute',
            top: 130,
            left: 60,
            right: 60,
            height: 2,
            background: `rgba(255,255,255,${hasPhoto ? 0.70 : 0.40})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: W,
            height: 20,
            background: effectiveAccent,
            opacity: hasPhoto ? 0.75 : 0.4,
          }}
        />
      </div>
    );
  }

  if (type === 'grain') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            backgroundImage: `radial-gradient(rgba(255,255,255,${dotAlpha}) 2px, transparent 2px)`,
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
            background: `rgba(255,255,255,${hasPhoto ? 0.20 : 0.15})`,
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
            background: `rgba(255,255,255,${hasPhoto ? 0.18 : 0.10})`,
          }}
        />
      </div>
    );
  }

  if (type === 'side-divider') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column' }}>
        {!hasPhoto && (
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
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 160,
            width: 6,
            height: H,
            background: effectiveAccent,
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 40,
            width: 60,
            height: 60,
            background: effectiveAccent,
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
            background: effectiveAccent,
            opacity: 0.85,
          }}
        />
      </div>
    );
  }

  if (type === 'dots-grid') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            backgroundImage: `radial-gradient(rgba(255,255,255,${hasPhoto ? 0.45 : 0.35}) 1.5px, transparent 1.5px)`,
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
            borderTop: `2px solid ${effectiveAccent}`,
            borderLeft: `2px solid ${effectiveAccent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 30,
            right: 30,
            width: 40,
            height: 40,
            borderTop: `2px solid ${effectiveAccent}`,
            borderRight: `2px solid ${effectiveAccent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: 30,
            width: 40,
            height: 40,
            borderBottom: `2px solid ${effectiveAccent}`,
            borderLeft: `2px solid ${effectiveAccent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            width: 40,
            height: 40,
            borderBottom: `2px solid ${effectiveAccent}`,
            borderRight: `2px solid ${effectiveAccent}`,
          }}
        />
      </div>
    );
  }

  if (type === 'corner-blobs') {
    const baseAccent = hasPhoto ? '#FFFFFF' : accent;
    const confetti: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      color: string;
    }> = [
      { x: 80, y: 80, size: 20, opacity: hasPhoto ? 0.75 : 0.45, color: baseAccent },
      { x: 180, y: 160, size: 12, opacity: hasPhoto ? 0.55 : 0.35, color: '#FFFFFF' },
      { x: 1040, y: 100, size: 24, opacity: hasPhoto ? 0.70 : 0.40, color: baseAccent },
      { x: 1120, y: 200, size: 14, opacity: hasPhoto ? 0.80 : 0.50, color: '#FFFFFF' },
      { x: 60, y: 500, size: 18, opacity: hasPhoto ? 0.70 : 0.40, color: '#FFFFFF' },
      { x: 180, y: 560, size: 10, opacity: hasPhoto ? 0.85 : 0.55, color: baseAccent },
      { x: 1070, y: 520, size: 22, opacity: hasPhoto ? 0.65 : 0.35, color: baseAccent },
      { x: 960, y: 570, size: 14, opacity: hasPhoto ? 0.75 : 0.45, color: '#FFFFFF' },
      { x: 400, y: 60, size: 10, opacity: hasPhoto ? 0.70 : 0.40, color: '#FFFFFF' },
      { x: 800, y: 70, size: 12, opacity: hasPhoto ? 0.65 : 0.35, color: baseAccent },
      { x: 350, y: 580, size: 16, opacity: hasPhoto ? 0.70 : 0.40, color: baseAccent },
      { x: 850, y: 590, size: 8, opacity: hasPhoto ? 0.75 : 0.45, color: '#FFFFFF' },
    ];

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex', flexDirection: 'column' }}>
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
      </div>
    );
  }

  return null;
}

export async function renderBrandedImage(recipe: BrandedImageRecipe): Promise<string> {
  const template = getTemplate(recipe.templateId);
  const composition = getComposition(recipe.compositionId);
  const hasPhoto = !!recipe.backgroundImageUrl;
  const hasHoliday = !!recipe.holidayName;
  const hasTransparency = recipe.logoHasTransparency ?? true;
  const showWebsite = recipe.showWebsite ?? template.showWebsite;
  const showHandles = recipe.showHandles ?? template.showHandles;

  const bgColors = template.background.colors;
  const panelColor = template.background.colors[0];
  const rawAccent = recipe.brandColors?.primary || template.textColor;
  const accentColor = ensureAccentContrast(rawAccent, bgColors, template.textColor);

  const iconRingColor =
    recipe.brandColors?.primary || accentColor || template.textColor;

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

  const baseTextStyle: React.CSSProperties = { fontFamily: 'Inter' };

  const panelTextColor = pickReadableTextColor(panelColor);
  const photoTextColor = '#FFFFFF';

  // ---- Build badges grouped into 2 rows ----
  const row1Badges: Badge[] = []; // socials + phone + whatsapp
  const row2Badges: Badge[] = []; // email + website

  if (recipe.contactPhone) {
    row1Badges.push({
      iconUri: CONTACT.phone.uri,
      color: CONTACT.phone.color,
      text: recipe.contactPhone,
    });
  }
  if (recipe.contactWhatsapp) {
    row1Badges.push({
      iconUri: CONTACT.whatsapp.uri,
      color: CONTACT.whatsapp.color,
      text: recipe.contactWhatsapp,
    });
  }
  if (showHandles && recipe.socialItems) {
    for (const item of recipe.socialItems) {
      const platform = PLATFORMS[item.platform];
      if (!platform) continue;
      row1Badges.push({
        iconUri: platform.uri,
        color: platform.color,
        text: item.handle,
      });
    }
  }

  if (recipe.contactEmail) {
    row2Badges.push({
      iconUri: CONTACT.email.uri,
      color: CONTACT.email.color,
      text: recipe.contactEmail,
    });
  }
  if (showWebsite && recipe.website) {
    row2Badges.push({
      iconUri: CONTACT.website.uri,
      color: CONTACT.website.color,
      text: recipe.website.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    });
  }

  const buildFooter = (textColor?: string) => {
    if (row1Badges.length === 0 && row2Badges.length === 0) return null;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          maxWidth: 1100,
          ...baseTextStyle,
          color: textColor || 'inherit',
        }}
      >
        {row1Badges.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 14,
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {row1Badges.map((badge, i) => (
              <ContactBadge key={`r1-${i}`} badge={badge} ringColor={iconRingColor} />
            ))}
          </div>
        )}
        {row2Badges.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 14,
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {row2Badges.map((badge, i) => (
              <ContactBadge key={`r2-${i}`} badge={badge} ringColor={iconRingColor} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const buildLogoRow = (size: number, textColor: string, accent: string) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        ...baseTextStyle,
        color: textColor,
      }}
    >
      <LogoElement logoUrl={recipe.logoUrl} hasTransparency={hasTransparency} size={size} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'row', width: 48, height: 3, background: accent, borderRadius: 2 }} />
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <span
            style={{
              fontSize: template.companyNameSize,
              fontWeight: 'bold',
              letterSpacing: 0.4,
            }}
          >
            {recipe.companyName}
          </span>
        </div>
        {recipe.tagline && (
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <span
              style={{
                fontSize: template.taglineSize,
                opacity: 0.85,
                letterSpacing: 0.4,
              }}
            >
              {recipe.tagline}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const buildHoliday = (fontSize: number, color: string) =>
    hasHoliday ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          ...baseTextStyle,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize,
              fontFamily: recipe.holidayFontName,
              textAlign: 'center',
              lineHeight: 1.15,
              maxWidth: 1000,
              color,
            }}
          >
            {recipe.holidayMessage || `Happy ${recipe.holidayName}!`}
          </span>
        </div>
        {recipe.holidayDate && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: Math.max(16, Math.round(fontSize * 0.28)),
                opacity: 0.85,
                letterSpacing: 2,
                fontFamily: recipe.holidayFontName,
                color,
              }}
            >
              {recipe.holidayDate}
            </span>
          </div>
        )}
        {recipe.dedication && (
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900 }}>
            <span
              style={{
                fontSize: 18,
                opacity: 0.85,
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              {recipe.dedication}
            </span>
          </div>
        )}
      </div>
    ) : null;

  let composed: React.ReactNode = null;

  if (composition.id === 'full-hero') {
    const overlayOp = composition.overlayOpacity ?? 0.65;
    const contentColor = hasPhoto ? photoTextColor : panelTextColor;
    const contentAccent = hasPhoto ? '#FFFFFF' : accentColor;
    composed = (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          width: 1200,
          height: 630,
          ...backgroundStyle,
        }}
      >
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.backgroundImageUrl!}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                background: '#0F172A',
                opacity: overlayOp,
              }}
            />
          </div>
        )}
        <DecorationLayer
          type={template.decoration}
          accent={accentColor}
          backgroundColors={bgColors}
          hasPhoto={hasPhoto}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: 50,
            zIndex: 1,
            color: contentColor,
          }}
        >
          {buildLogoRow(110, contentColor, contentAccent)}
          {buildHoliday(84, hasPhoto ? photoTextColor : holidayColor)}
          {buildFooter(contentColor)}
        </div>
      </div>
    );
  } else if (composition.id === 'bottom-panel') {
    const panelH = composition.panelSize ?? 300;
    const photoH = 630 - panelH;
    composed = (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          width: 1200,
          height: 630,
          ...backgroundStyle,
        }}
      >
        {hasPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.backgroundImageUrl!}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1200,
              height: photoH,
              objectFit: 'cover',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: photoH,
            left: 0,
            width: 1200,
            height: panelH,
            background: panelColor,
          }}
        />
        <DecorationLayer
          type={template.decoration}
          accent={accentColor}
          backgroundColors={bgColors}
          hasPhoto={hasPhoto}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            paddingTop: photoH + 16,
            paddingBottom: 20,
            paddingLeft: 40,
            paddingRight: 40,
            zIndex: 1,
            color: panelTextColor,
            gap: 14,
          }}
        >
          {buildHoliday(46, holidayColor)}
          {buildFooter(panelTextColor)}
        </div>
      </div>
    );
  } else if (composition.id === 'top-panel') {
    const panelH = composition.panelSize ?? 260;
    const photoH = 630 - panelH;
    composed = (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          width: 1200,
          height: 630,
          ...backgroundStyle,
        }}
      >
        {hasPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.backgroundImageUrl!}
            alt=""
            style={{
              position: 'absolute',
              top: panelH,
              left: 0,
              width: 1200,
              height: photoH,
              objectFit: 'cover',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1200,
            height: panelH,
            background: panelColor,
          }}
        />
        <DecorationLayer
          type={template.decoration}
          accent={accentColor}
          backgroundColors={bgColors}
          hasPhoto={hasPhoto}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: panelH,
              padding: '16px 40px',
              gap: 8,
              color: panelTextColor,
            }}
          >
            {buildLogoRow(66, panelTextColor, accentColor)}
            {hasHoliday && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: 28,
                    fontFamily: recipe.holidayFontName,
                    color: holidayColor,
                    textAlign: 'center',
                  }}
                >
                  {recipe.holidayMessage || `Happy ${recipe.holidayName}!`}
                </span>
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: 20,
            }}
          >
            {(row1Badges.length > 0 || row2Badges.length > 0) && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '10px 18px',
                  borderRadius: 14,
                  background: 'rgba(0,0,0,0.45)',
                  color: '#FFFFFF',
                }}
              >
                {buildFooter('#FFFFFF')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else if (composition.id === 'left-panel') {
    const panelW = composition.panelSize ?? 500;
    const photoW = 1200 - panelW;
    const fadeW = Math.round(photoW * 0.25);
    composed = (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          width: 1200,
          height: 630,
          ...backgroundStyle,
        }}
      >
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: panelW,
              width: photoW,
              height: 630,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.backgroundImageUrl!}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: photoW,
                height: 630,
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: fadeW,
                height: 630,
                backgroundImage: `linear-gradient(90deg, ${panelColor} 0%, ${panelColor}00 100%)`,
              }}
            />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: panelW,
            height: 630,
            background: panelColor,
          }}
        />
        <DecorationLayer
          type={template.decoration}
          accent={accentColor}
          backgroundColors={bgColors}
          hasPhoto={hasPhoto}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: panelW,
            height: '100%',
            padding: 36,
            zIndex: 1,
            color: panelTextColor,
          }}
        >
          {buildLogoRow(70, panelTextColor, accentColor)}
          {buildHoliday(42, holidayColor)}
          {buildFooter(panelTextColor)}
        </div>
      </div>
    );
  } else if (composition.id === 'right-panel') {
    const panelW = composition.panelSize ?? 500;
    const panelX = 1200 - panelW;
    const fadeW = Math.round(panelX * 0.25);
    composed = (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          width: 1200,
          height: 630,
          ...backgroundStyle,
        }}
      >
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: panelX,
              height: 630,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.backgroundImageUrl!}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: panelX,
                height: 630,
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: panelX - fadeW,
                width: fadeW,
                height: 630,
                backgroundImage: `linear-gradient(90deg, ${panelColor}00 0%, ${panelColor} 100%)`,
              }}
            />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: panelX,
            width: panelW,
            height: 630,
            background: panelColor,
          }}
        />
        <DecorationLayer
          type={template.decoration}
          accent={accentColor}
          backgroundColors={bgColors}
          hasPhoto={hasPhoto}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: panelX,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: panelW,
            height: 630,
            padding: 36,
            zIndex: 1,
            color: panelTextColor,
          }}
        >
          {buildLogoRow(70, panelTextColor, accentColor)}
          {buildHoliday(42, holidayColor)}
          {buildFooter(panelTextColor)}
        </div>
      </div>
    );
  } else if (composition.id === 'center-card') {
    const cardW = composition.cardWidth ?? 760;
    const cardH = composition.cardHeight ?? 470;
    const overlayOp = composition.overlayOpacity ?? 0.25;
    const cardX = Math.round((1200 - cardW) / 2);
    const cardY = Math.round((630 - cardH) / 2);

    const cardBackground: React.CSSProperties =
      template.background.type === 'gradient'
        ? {
            backgroundImage: `linear-gradient(${template.background.angle || 135}deg, ${template.background.colors.join(', ')})`,
          }
        : {
            background: template.background.colors[0],
          };

    composed = (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          width: 1200,
          height: 630,
          ...backgroundStyle,
        }}
      >
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.backgroundImageUrl!}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                background: '#0F172A',
                opacity: overlayOp,
              }}
            />
          </div>
        )}
        <DecorationLayer
          type={template.decoration}
          accent={accentColor}
          backgroundColors={bgColors}
          hasPhoto={hasPhoto}
        />
        <div
          style={{
            position: 'absolute',
            top: cardY,
            left: cardX,
            width: cardW,
            height: cardH,
            borderRadius: 32,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 32,
            zIndex: 1,
            color: panelTextColor,
            ...cardBackground,
          }}
        >
          {buildLogoRow(60, panelTextColor, accentColor)}
          {buildHoliday(48, holidayColor)}
          {buildFooter(panelTextColor)}
        </div>
      </div>
    );
  } else if (composition.id === 'center-circle') {
    const circleSize = composition.circleSize ?? 460;
    const overlayOp = composition.overlayOpacity ?? 0.30;
    const circleX = Math.round((1200 - circleSize) / 2);
    const circleY = Math.round((630 - circleSize) / 2);
    composed = (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          width: 1200,
          height: 630,
          ...backgroundStyle,
        }}
      >
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.backgroundImageUrl!}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                background: '#0F172A',
                opacity: overlayOp,
              }}
            />
          </div>
        )}
        <DecorationLayer
          type={template.decoration}
          accent={accentColor}
          backgroundColors={bgColors}
          hasPhoto={hasPhoto}
        />
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 50,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2,
          }}
        >
          {buildLogoRow(80, photoTextColor, '#FFFFFF')}
        </div>
        {hasHoliday && (
          <div
            style={{
              position: 'absolute',
              top: circleY,
              left: circleX,
              width: circleSize,
              height: circleSize,
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 36,
              zIndex: 1,
              color: panelTextColor,
              background: panelColor,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 52,
                  fontFamily: recipe.holidayFontName,
                  textAlign: 'center',
                  lineHeight: 1.1,
                  color: holidayColor,
                }}
              >
                {recipe.holidayMessage || `Happy ${recipe.holidayName}!`}
              </span>
              {recipe.holidayDate && (
                <span
                  style={{
                    fontSize: 16,
                    opacity: 0.85,
                    letterSpacing: 2,
                    fontFamily: recipe.holidayFontName,
                    color: holidayColor,
                    marginTop: 10,
                  }}
                >
                  {recipe.holidayDate}
                </span>
              )}
            </div>
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            width: 1200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          {buildFooter(photoTextColor)}
        </div>
      </div>
    );
  } else if (composition.id === 'vignette') {
    const edgeH = composition.vignetteEdge ?? 130;
    const contentColor = hasPhoto ? photoTextColor : panelTextColor;
    const contentAccent = hasPhoto ? '#FFFFFF' : accentColor;
    composed = (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          width: 1200,
          height: 630,
          ...backgroundStyle,
        }}
      >
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.backgroundImageUrl!}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1200,
                height: 630,
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 1200,
                height: edgeH,
                backgroundImage:
                  'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 1200,
                height: edgeH,
                backgroundImage:
                  'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)',
              }}
            />
          </div>
        )}
        <DecorationLayer
          type={template.decoration}
          accent={accentColor}
          backgroundColors={bgColors}
          hasPhoto={hasPhoto}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: 50,
            zIndex: 1,
            color: contentColor,
          }}
        >
          {buildLogoRow(110, contentColor, contentAccent)}
          {buildHoliday(84, hasPhoto ? photoTextColor : holidayColor)}
          {buildFooter(contentColor)}
        </div>
      </div>
    );
  } else {
    // Fallback — same as full-hero behaviour, Satori-safe
    composed = (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          width: 1200,
          height: 630,
          ...backgroundStyle,
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: 50,
            color: panelTextColor,
          }}
        >
          {buildLogoRow(110, panelTextColor, accentColor)}
          {buildHoliday(84, holidayColor)}
          {buildFooter(panelTextColor)}
        </div>
      </div>
    );
  }

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