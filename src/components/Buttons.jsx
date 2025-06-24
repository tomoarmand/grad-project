const numbers = [1, 2, 3, 4, 5, 6, 7]

function Buttons({onClick}) {
    return (
        <>
        <div className="flex gap-3">
        {numbers.map((num) => (
            <button onClick={()=>onClick(num)} className="text-lg sm:text-xl md:text-2xl border-none rounded px-4 py-2 text-center inline-block text-[#f8fafc] bg-[#64748b] hover:bg-[#fb923c]">{num}</button>
        ))}
        </div>
        </>
    )
}


export default Buttons