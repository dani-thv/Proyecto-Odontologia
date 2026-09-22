import { NavLink } from "react-router-dom";
import { DotsIcon } from "@/components/icons";
import { NAV } from "./nav";

interface Props {
  visible: boolean;
  moreOpen: boolean;
  onOpenMore: () => void;
}

/** Barra inferior móvil: 4 destinos + "Más" (regla de 3 a 5 destinos). */
export default function BottomTabBar({ visible, moreOpen, onOpenMore }: Props) {
  return (
    <nav className={`bottom-tab-bar${visible ? "" : " nav-hidden"}`} aria-label="Navegación principal">
      <div className="bottom-tab-bar-inner">
        {NAV.map(({ path, label, Icon }) => (
          <NavLink key={path} to={path} className={({ isActive }) => `bottom-tab-item${isActive ? " active" : ""}`}>
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          className={`bottom-tab-item${moreOpen ? " active" : ""}`}
          onClick={onOpenMore}
          aria-label="Más opciones"
          aria-haspopup="dialog"
        >
          <DotsIcon size={22} strokeWidth={moreOpen ? 2.5 : 1.8} />
          <span>Más</span>
        </button>
      </div>
    </nav>
  );
}
