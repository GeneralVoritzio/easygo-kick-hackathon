import { Fragment, useState } from "react";
import { Icon, type KickIconName } from "../Icon";
import kickLogo from "../brand/kick-logo.svg";

const columns = [
  {
    title: "Company",
    links: [
      { label: "About Us" },
      { label: "Brand" },
      { label: "News & Press" },
      { label: "Download" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help & Support" },
      { label: "KICK Streamers" },
      { label: "KICK Developer" },
      { label: "KICK Bounties" },
      { label: "KICK Shop" },
      { label: "Law Enforcement Request" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Community Guidelines" },
      { label: "DMCA Policy" },
      { label: "Privacy Policy" },
      { label: "Terms of Service" },
      { label: "Your Privacy Choices" },
      { label: "Cookie Policy" },
      { label: "Partner Terms & Conditions" },
      { label: "Bounties Terms & Conditions" },
      { label: "KICKs Usage Policy" },
      { label: "Advertising Policy" },
      { label: "KICK Drops Terms" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "Support: support@kick.com" },
      { label: "Partners: kickpartners@kick.com" },
      { label: "Press: press@kick.com" },
    ],
  },
];

const socials: { name: KickIconName; title: string }[] = [
  { name: "x", title: "X" },
  { name: "instagram", title: "Instagram" },
  { name: "tiktok", title: "TikTok" },
  { name: "discord", title: "Discord" },
  { name: "reddit", title: "Reddit" },
];

// KICK shows every column open above md, and collapses each one into an accordion below it.
function FooterColumn({ title, links }: (typeof columns)[number]) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-row items-center justify-between gap-2 md:pointer-events-none"
      >
        <span className="text-start text-base font-bold text-white">{title}</span>
        <Icon
          name="company"
          className={`size-4 shrink-0 grow-0 fill-current text-white transition-transform md:hidden ${
            open ? "-rotate-90" : "rotate-90"
          }`}
        />
      </button>
      <ul className={`flex-col gap-1 md:flex ${open ? "flex" : "hidden"}`}>
        {links.map((link) => (
          <li key={link.label}>
            <button
              type="button"
              title={link.label}
              className="text-start text-sm font-normal text-[#9FA6AD] transition-colors betterhover:hover:text-white"
            >
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="flex flex-col gap-4 pt-8 md:pt-0">
      <div className="flex max-h-6 w-fit items-center justify-center">
        <img src={kickLogo} alt="Kick Logo" className="h-full" />
      </div>

      <div className="flex flex-col gap-5 md:grid md:grid-cols-[repeat(3,minmax(200px,1fr))] lg:grid-cols-[repeat(4,minmax(200px,1fr))] 3xl:grid-cols-[repeat(5,minmax(200px,1fr))]">
        {columns.map((column) => (
          <Fragment key={column.title}>
            <FooterColumn {...column} />
            <hr className="border-outline-decorative md:hidden" />
          </Fragment>
        ))}

        <div className="flex flex-col items-center gap-4 md:w-fit">
          <div className="flex flex-row flex-wrap gap-2">
            {socials.map((social) => (
              <button
                key={social.title}
                type="button"
                title={social.title}
                aria-label={social.title}
                className="flex size-10 shrink-0 grow-0 items-center justify-center rounded bg-secondary-base/20 text-white transition-all betterhover:active:scale-[0.95]"
              >
                <Icon name={social.name} className="size-4 shrink-0 grow-0 fill-current" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
