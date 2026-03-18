import { useNavigate } from "react-router-dom";
import yeti from "@/assets/not-found/404.png";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        <img
          src={yeti}
          className="w-[20rem] select-none pointer-events-none"
          alt="404"
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
        />

        <h1 className="text-2xl text-white font-semibold">Страница не найдена</h1>

        <button
          type="button"
          onClick={() => navigate("/feed")}
          className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition text-white"
        >
          На главную
        </button>
      </div>
    </div>
  );
};

export default NotFound;
