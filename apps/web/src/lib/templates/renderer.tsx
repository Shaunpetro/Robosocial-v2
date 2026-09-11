// apps/web/src/lib/templates/renderer.tsx
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { TEMPLATES, TemplateDefinition } from './index';
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
  fontData: ArrayBuffer;
  fontName: string;
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

  const LogoBlock = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <LogoElement logoUrl={recipe.logoUrl} hasTransparency={hasTransparency} size={100} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 56, height: 4, background: accentColor, borderRadius: 2 }} />
        <div style={{ fontSize: 34, fontWeight: 'bold', letterSpacing: 1 }}>
          {recipe.companyName}
        </div>
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
        }}
      >
        {allBadges.map((badge, i) => (
          <ContactBadge key={i} badge={badge} />
        ))}
      </div>
    ) : null;

  let children: React.ReactNode;

  if (logoPosition === 'center') {
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
          <LogoElement logoUrl={recipe.logoUrl} hasTransparency={hasTransparency} size={180} />
          <div style={{ width: 80, height: 4, background: accentColor, borderRadius: 2 }} />
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
            gap: 24,
          }}
        >
          {LogoBlock}
          {FooterBlock}
        </div>
      </div>
    );
  } else {
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