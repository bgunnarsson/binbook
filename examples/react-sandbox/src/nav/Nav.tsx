import { Link } from "react-router-dom";

export interface NavProps {
  label?: string;
}

// Uses react-router's <Link>, so it only renders inside a Router — supplied by
// the withRouter decorator (see nav.binbook.json). Without it, React throws.
export default function Nav({ label = "Home" }: NavProps) {
  return (
    <nav className="nav" aria-label="Primary">
      <Link className="nav__link" to="/">
        {label}
      </Link>
      <Link className="nav__link" to="/about">
        About
      </Link>
    </nav>
  );
}
