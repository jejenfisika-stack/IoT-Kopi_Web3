'use client'

// Istilah dengan tooltip glosarium (muncul saat hover).
// Pakai: <Istilah def="penjelasan...">hash</Istilah>
export default function Istilah({ def, children, chip = false }) {
  return (
    <span className={`group relative inline-flex cursor-help ${chip ? 'chip px-2.5 py-1 text-[11px] font-semibold text-gray-200' : 'border-b border-dotted border-gray-500 text-gray-200'}`}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0d1320] px-3 py-2 text-left text-[11px] font-normal leading-snug text-gray-300 opacity-0 shadow-2xl transition-opacity duration-150 group-hover:opacity-100">
        {def}
      </span>
    </span>
  )
}
