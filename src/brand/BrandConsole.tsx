import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useEngine } from '../engine/store'
import { textLogo } from '../data/catalog'
import type { Brand, BrandProp, Finish, PropModel, Skin } from '../engine/types'
import PropPicker from './PropPicker'
import SkinEditor, { type LogoMode } from './SkinEditor'
import PropPreview from '../face/PropPreview'

const DEFAULT_PRICE = 2000
const DEFAULT_DURATION = 30
const KYC_CHECKLIST = ['Business verified', 'Payment on file', 'Brand safety review']

export default function BrandConsole() {
  const brands = useEngine((s) => s.brands)
  const propModels = useEngine((s) => s.propModels)
  const brandProps = useEngine((s) => s.brandProps)
  const signedInBrandId = useEngine((s) => s.signedInBrandId)
  const signInBrand = useEngine((s) => s.signInBrand)
  const saveBrandProp = useEngine((s) => s.saveBrandProp)
  const fireSponsorEvent = useEngine((s) => s.fireSponsorEvent)

  const brand = useMemo(
    () => brands.find((b) => b.id === signedInBrandId) ?? null,
    [brands, signedInBrandId],
  )

  const [selectedModelId, setSelectedModelId] = useState(propModels[0]?.id ?? '')
  const [baseColor, setBaseColor] = useState('#53fc18')
  const [finish, setFinish] = useState<Finish>('matte')
  const [logoMode, setLogoMode] = useState<LogoMode>('brand')
  const [customText, setCustomText] = useState('')
  const [priceUsd, setPriceUsd] = useState(DEFAULT_PRICE)
  const [baseDurationSec, setBaseDurationSec] = useState(DEFAULT_DURATION)

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  // reset the studio to sensible defaults whenever a (new) brand signs in
  useEffect(() => {
    if (!brand) return
    setSelectedModelId(propModels[0]?.id ?? '')
    setBaseColor(brand.primaryColor)
    setFinish('matte')
    setLogoMode('brand')
    setCustomText('')
    setPriceUsd(DEFAULT_PRICE)
    setBaseDurationSec(DEFAULT_DURATION)
  }, [brand, propModels])

  const skin: Skin = useMemo(() => {
    const logoUrl =
      logoMode === 'brand'
        ? brand?.logoUrl
        : logoMode === 'custom' && customText.trim()
          ? textLogo(customText.trim(), '#111827', '#ffffff')
          : undefined
    return { baseColor, finish, logoUrl }
  }, [baseColor, finish, logoMode, customText, brand])

  const myProps = useMemo(
    () => (brand ? brandProps.filter((bp) => bp.brandId === brand.id) : []),
    [brandProps, brand],
  )

  const handleSave = () => {
    if (!brand || !selectedModelId) return
    const bp: BrandProp = {
      id: `bp-${brand.id}-${Date.now()}`,
      brandId: brand.id,
      propModelId: selectedModelId,
      skin,
      priceUsd,
      baseDurationSec,
    }
    saveBrandProp(bp)
    showToast('Saved to your prop library ✓')
  }

  const handleTip = (bp: BrandProp) => {
    fireSponsorEvent(bp.id)
    showToast('Sent to stream — watch it land!')
  }

  return (
    <div className="min-h-screen bg-kick-dark text-kick-text">
      <TopBar />

      {!brand ? (
        <SignIn brands={brands} onSignIn={signInBrand} />
      ) : (
        <>
          <header className="flex items-center justify-between border-b border-kick-border bg-kick-panel px-6 py-4">
            <div className="flex items-center gap-3">
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-11 w-11 rounded-lg object-cover ring-1 ring-kick-border"
              />
              <div>
                <div className="text-base font-semibold text-kick-text">{brand.name}</div>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-kick/15 px-2 py-0.5 text-xs font-semibold text-kick">
                  ✓ Verified Brand
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signInBrand(null)}
              className="rounded-lg border border-kick-border px-3 py-1.5 text-sm text-kick-muted transition hover:border-kick-muted hover:text-kick-text"
            >
              Sign out
            </button>
          </header>

          <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-2">
            {/* left: studio controls */}
            <div className="space-y-6">
              <PropPicker
                propModels={propModels}
                selectedId={selectedModelId}
                onSelect={setSelectedModelId}
              />

              <SkinEditor
                baseColor={baseColor}
                onBaseColorChange={setBaseColor}
                finish={finish}
                onFinishChange={setFinish}
                logoMode={logoMode}
                onLogoModeChange={setLogoMode}
                customText={customText}
                onCustomTextChange={setCustomText}
                brandLogoUrl={brand.logoUrl}
              />

              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-kick-muted">
                  3 · Price it
                </h2>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-kick-border bg-kick-panel-2 p-4">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-kick-muted">
                      Tip price (USD)
                    </span>
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-lg border border-kick-border bg-kick-dark px-3 py-2 text-sm text-kick-text outline-none focus:border-kick"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-kick-muted">
                      Duration (sec)
                    </span>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={baseDurationSec}
                      onChange={(e) => setBaseDurationSec(Math.max(1, Number(e.target.value)))}
                      className="w-full rounded-lg border border-kick-border bg-kick-dark px-3 py-2 text-sm text-kick-text outline-none focus:border-kick"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!selectedModelId}
                  className="mt-3 w-full rounded-xl bg-kick px-4 py-3 text-sm font-semibold text-kick-dark transition hover:bg-kick-dim disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save to prop library
                </button>
              </section>
            </div>

            {/* right: live preview + library */}
            <div className="space-y-8">
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-kick-muted">
                  Live preview
                </h2>
                <div className="overflow-hidden rounded-2xl border border-kick-border bg-kick-panel">
                  <PropPreview propModelId={selectedModelId} skin={skin} className="aspect-[16/10] w-full" />
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-kick-muted">
                    Your prop library
                  </h2>
                  <Link to="/stream" className="text-xs text-kick-muted underline-offset-2 hover:text-kick hover:underline">
                    View live stream →
                  </Link>
                </div>

                {myProps.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-kick-border p-6 text-center text-sm text-kick-muted">
                    No props yet — design one on the left and save it.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {myProps.map((bp) => (
                      <LibraryCard
                        key={bp.id}
                        bp={bp}
                        model={propModels.find((m) => m.id === bp.propModelId)}
                        onTip={() => handleTip(bp)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-slide-up rounded-xl border border-kick bg-kick-panel px-4 py-3 text-sm font-medium text-kick-text shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  )
}

function TopBar() {
  return (
    <div className="flex items-center justify-between border-b border-kick-border px-6 py-4">
      <div className="text-sm font-bold tracking-wide text-kick-text">
        Hype<span className="text-kick">Props</span>{' '}
        <span className="font-normal text-kick-muted">· Brand Console</span>
      </div>
      <Link to="/stream" className="text-sm text-kick-muted transition hover:text-kick">
        View live stream →
      </Link>
    </div>
  )
}

function SignIn({
  brands,
  onSignIn,
}: {
  brands: Brand[]
  onSignIn: (brandId: string | null) => void
}) {
  return (
    <div className="grid min-h-[calc(100vh-65px)] place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-kick-border bg-kick-panel p-6 shadow-2xl">
        <h1 className="mb-1 text-lg font-semibold text-kick-text">Sign in as a verified brand</h1>
        <p className="mb-5 text-sm text-kick-muted">
          Mock KYC for the demo — every check clears instantly.
        </p>

        <ul className="mb-6 space-y-2">
          {KYC_CHECKLIST.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 rounded-lg border border-kick-border bg-kick-panel-2 px-3 py-2 text-sm"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-kick text-[11px] font-bold text-kick-dark">
                ✓
              </span>
              <span className="text-kick-text">{item}</span>
              <span className="ml-auto text-xs text-kick-muted">instant</span>
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSignIn(b.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-kick-border bg-kick-panel-2 px-4 py-3 text-left transition hover:border-kick hover:shadow-[0_0_20px_-6px_var(--color-kick)]"
            >
              <img src={b.logoUrl} alt={b.name} className="h-10 w-10 rounded-lg object-cover" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-kick-text">{b.name}</div>
                <div className="text-xs text-kick-muted">Verified brand</div>
              </div>
              <span className="text-kick-muted">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function LibraryCard({
  bp,
  model,
  onTip,
}: {
  bp: BrandProp
  model: PropModel | undefined
  onTip: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-kick-border bg-kick-panel-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-kick-text">{model?.name ?? 'Prop'}</span>
        <span
          className="h-5 w-5 shrink-0 rounded-full border border-kick-border"
          style={{ backgroundColor: bp.skin.baseColor }}
          title={bp.skin.baseColor}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-kick-muted">
        <span className="capitalize">{bp.skin.finish}</span>
        <span>·</span>
        <span>${bp.priceUsd.toLocaleString()}</span>
        <span>·</span>
        <span>{bp.baseDurationSec}s</span>
      </div>
      <button
        type="button"
        onClick={onTip}
        className="mt-1 rounded-lg bg-kick px-3 py-2 text-xs font-semibold text-kick-dark transition hover:bg-kick-dim"
      >
        ⚡ Tip into stream
      </button>
    </div>
  )
}
