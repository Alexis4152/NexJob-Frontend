// Dibuja a escala real un mueble (vista lateral esquematica) junto a una persona de referencia
// de 1.70 m, calculado a partir de las medidas que el cliente captura. Nada de fotos: son
// figuras simples (rectangulos/circulo) posicionadas por calculo, para darle al cliente una idea
// de tamano real sin depender de que sepa interpretar centimetros en abstracto.
export default function FurnitureScaleDrawing({ lengthCm, heightCm }) {
  const len = Math.max(1, Number(lengthCm) || 0)
  const height = Math.max(1, Number(heightCm) || 0)
  const personCm = 170

  const groundY = 185
  const topPad = 20
  const availH = groundY - topPad
  const leftMargin = 14
  const personSlotW = 46
  const gapAfterPerson = 26
  const rightMargin = 46
  const availW = 380 - leftMargin - personSlotW - gapAfterPerson - rightMargin

  const scale = Math.max(0.12, Math.min(availH / Math.max(personCm, height), availW / len))

  const personH = personCm * scale
  const personW = personSlotW * 0.55
  const personX = leftMargin + (personSlotW - personW) / 2
  const headR = personH * 0.11
  const headCy = groundY - personH + headR
  const bodyTop = headCy + headR

  const tableX = leftMargin + personSlotW + gapAfterPerson
  const tableW = len * scale
  const tableH = height * scale
  const tableTopY = groundY - tableH
  const topThickness = Math.max(4, scale * 3)
  const legThickness = Math.max(3, scale * 4)
  const legInset = Math.min(tableW * 0.12, 14)

  const dimY = tableTopY - 10
  const dimX = tableX + tableW + 14

  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 380 220"
        role="img"
        aria-label={`Comparacion a escala entre una persona de 1.70 m y un mueble de ${len} por ${height} centimetros`}
        style={{ width: '100%', height: 'auto', maxHeight: 220 }}
      >
        <line x1="14" y1={groundY} x2="366" y2={groundY} stroke="#D1D5DB" strokeWidth="1.5" />

        <circle cx={personX + personW / 2} cy={headCy} r={headR} fill="#9CA3AF" />
        <rect x={personX} y={bodyTop} width={personW} height={Math.max(0, groundY - bodyTop)} rx={personW * 0.4} fill="#9CA3AF" />
        <text x={personX + personW / 2} y={groundY + 16} textAnchor="middle" fontSize="11" fill="#6B7280">1.70 m (ref.)</text>

        <line x1={tableX} x2={tableX} y1={dimY - 4} y2={dimY + 4} stroke="#0D3FB0" strokeWidth="1.5" />
        <line x1={tableX + tableW} x2={tableX + tableW} y1={dimY - 4} y2={dimY + 4} stroke="#0D3FB0" strokeWidth="1.5" />
        <line x1={tableX} x2={tableX + tableW} y1={dimY} y2={dimY} stroke="#0D3FB0" strokeWidth="1.5" />
        <text x={tableX + tableW / 2} y={dimY - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0D3FB0">{len} cm</text>

        <line x1={dimX - 4} x2={dimX + 4} y1={tableTopY} y2={tableTopY} stroke="#0D3FB0" strokeWidth="1.5" />
        <line x1={dimX - 4} x2={dimX + 4} y1={groundY} y2={groundY} stroke="#0D3FB0" strokeWidth="1.5" />
        <line x1={dimX} x2={dimX} y1={tableTopY} y2={groundY} stroke="#0D3FB0" strokeWidth="1.5" />
        <text x={dimX + 8} y={(tableTopY + groundY) / 2} dominantBaseline="middle" fontSize="11" fontWeight="600" fill="#0D3FB0">{height} cm</text>

        <rect x={tableX + legInset} y={tableTopY + topThickness} width={legThickness} height={Math.max(0, groundY - (tableTopY + topThickness))} fill="#B3DDFF" />
        <rect x={tableX + tableW - legInset - legThickness} y={tableTopY + topThickness} width={legThickness} height={Math.max(0, groundY - (tableTopY + topThickness))} fill="#B3DDFF" />
        <rect x={tableX} y={tableTopY} width={tableW} height={topThickness} rx="2" fill="#155DEA" />
      </svg>
      <figcaption className="text-xs text-gray-500 mt-1">
        Comparacion a escala: una persona de referencia (1.70 m) junto al mueble con las medidas de arriba.
      </figcaption>
    </figure>
  )
}
