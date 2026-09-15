// apps/web/src/lib/templates/renderer.tsx
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { TEMPLATES, TemplateDefinition, DecorationType } from './index';
import { PLATFORMS, CONTACT } from './icons';

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
          width: 28,
          height: 28,
          borderRadius: 8,
          background: badge.color,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={badge.iconUri} alt="" style={{ width: 15, height: 15 }} />
      </div>
      <span style={{ fontSize: 17, opacity: 0.9 }}>{badge.text}</span>
    </div>
  );
}

/**
 * Renders the decorative overlay for a template.
 * Uses only Satori-supported CSS: absolutely-positioned divs, gradients,
 * borders, border-radius.
 */
function DecorationLayer({
  type,
  accent,
  textColor,
}: {
  type: DecorationType;
  accent: string;
  textColor: string;
}) {
  const W = 1200;
  const H = 630;

  if (type === 'none') return null;

  if (type === 'top-bar') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: W,
          height: 12,
          background: accent,
        }}
      />
    );
  }

  if (type === 'corner-circles') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: -160,
            right: -160,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            left: -200,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
      </>
    );
  }

  if (type === 'border-frame') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: `1px solid rgba(255,255,255,0.15)`,
            borderRadius: 4,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 6,
            height: H,
            background: accent,
          }}
        />
      </>
    );
  }

  if (type === 'double-divider') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 140,
            left: 60,
            right: 60,
            height: 1,
            background: 'rgba(255,255,255,0.25)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 140,
            left: 60,
            right: 60,
            height: 1,
            background: 'rgba(255,255,255,0.25)',
          }}
        />
      </>
    );
  }

  if (type === 'corner-triangle') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 0,
            height: 0,
            borderTop: `220px solid rgba(255,255,255,0.06)`,
            borderLeft: `220px solid transparent`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 0,
            height: 0,
            borderBottom: `280px solid rgba(0,0,0,0.15)`,
            borderRight: `280px solid transparent`,
          }}
        />
      </>
    );
  }

  if (type === 'diagonal-band') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            backgroundImage: `linear-gradient(120deg, ${accent}33 0%, ${accent}00 40%, ${accent}00 60%, ${accent}33 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 80,
            right: 60,
            width: 80,
            height: 4,
            background: accent,
            borderRadius: 2,
          }}
        />
      </>
    );
  }

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
            backgroundImage: `radial-gradient(${accent}30 1.5px, transparent 1.5px)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            width: 40,
            height: 40,
            borderTop: `2px solid ${accent}`,
            borderLeft: `2px solid ${accent}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 40,
            width: 40,
            height: 40,
            borderBottom: `2px solid ${accent}`,
            borderRight: `2px solid ${accent}`,
          }}
        />
      </>
    );
  }

  if (type === 'corner-blobs') {
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -140,
            left: -140,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 100,
            left: 60,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.35)',
          }}
        />
      </>
    );
  }

  return null;
}

export async function renderBrandedImage(recipe: BrandedImageRecipe): Promise<Buffer> {
  const template = getTemplate(recipe.templateId);
  const showWebsite = recipe.showWebsite ?? template.showWebsite;
  const showHandles = recipe.showHandles ?? template.showHandles;
  const logoPosition = recipe.logoPosition || 'top';
  const hasHoliday = !!recipe.holidayName;
  const hasTransparency = recipe.logoHasTransparency ?? true;

  const accentColor = recipe.brandColors?.primary || template.textColor;

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, ...baseTextStyle }}>
      <LogoElement logoUrl={recipe.logoUrl} hasTransparency={hasTransparency} size={100} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 56, height: 4, background: accentColor, borderRadius: 2 }} />
        <div style={{ fontSize: template.companyNameSize, fontWeight: 'bold', letterSpacing: 0.5 }}>
          {recipe.companyName}
        </div>
        {recipe.tagline && (
          <div
            style={{
              fontSize: 18,
              opacity: 0.75,
              letterSpacing: 0.5,
              fontFamily: 'Inter',
              marginTop: 2,
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
        }}
      >
        {recipe.holidayMessage || `Happy ${recipe.holidayName}!`}
      </div>
      {recipe.holidayDate && (
        <div
          style={{
            fontSize: 28,
            opacity: 0.85,
            letterSpacing: 2,
            fontFamily: recipe.holidayFontName,
          }}
        >
          {recipe.holidayDate}
        </div>
      )}
      {recipe.dedication && (
        <div
          style={{
            fontSize: 20,
            opacity: 0.75,
            fontFamily: 'Inter',
            fontStyle: 'italic',
            marginTop: 10,
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
          gap: 22,
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
          padding: 60,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flex: 1 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            ...baseTextStyle,
          }}
        >
          <LogoElement logoUrl={recipe.logoUrl} hasTransparency={hasTransparency} size={160} />
          <div style={{ width: 80, height: 4, background: accentColor, borderRadius: 2 }} />
          <div style={{ fontSize: 38, fontWeight: 'bold' }}>{recipe.companyName}</div>
          {recipe.tagline && (
            <div style={{ fontSize: 18, opacity: 0.75, marginTop: -8 }}>
              {recipe.tagline}
            </div>
          )}
          {hasHoliday && (
            <div
              style={{
                fontSize: 52,
                fontFamily: recipe.holidayFontName,
                textAlign: 'center',
                marginTop: 20,
              }}
            >
              {recipe.holidayMessage || `Happy ${recipe.holidayName}!`}
            </div>
          )}
          {recipe.dedication && (
            <div
              style={{
                fontSize: 20,
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
          padding: 60,
          position: 'relative',
        }}
      >
        {HolidayBlock}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
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
          padding: 60,
          position: 'relative',
        }}
      >
        {LogoBlock}
        {HolidayBlock}
        {FooterBlock}
      </div>
    );
  }

  // Compose with decoration layer
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
        textColor={template.textColor}
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

  return await sharp(pngBuffer).resize(1200, 630).png().toBuffer();
}