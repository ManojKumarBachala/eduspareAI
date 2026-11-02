import Image from "next/image";

export default function Banner() {
    return (
        <div className="
      relative
      h-[320px]
      overflow-hidden
      rounded-3xl
      shadow-2xl
      mb-10
    ">

            <Image
                src="/images/school-bg.jpg"
                alt="School"
                fill
                className="object-cover"
            />

            <div className="
        absolute
        inset-0
        bg-gradient-to-r
        from-black/80
        via-black/50
        to-transparent
      ">

                <div className="p-10">

                    <h1 className="text-5xl font-bold text-white">
                        New Little Flower School
                    </h1>

                    <p className="text-white mt-4 text-xl">
                        Smart AI Powered Education Platform
                    </p>

                    <div className="mt-8 flex gap-4">

                        <button className="
              bg-blue-600
              hover:bg-blue-700
              text-white
              px-6
              py-3
              rounded-xl
            ">
                            Explore Dashboard
                        </button>

                        <button className="
              bg-white/20
              backdrop-blur-lg
              text-white
              px-6
              py-3
              rounded-xl
            ">
                            View Reports
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}