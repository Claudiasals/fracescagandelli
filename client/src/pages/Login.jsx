import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Lock, Eye, EyeClosed } from "phosphor-react";
import { API_BASE } from "../config/api.js";

const Login = () => {

    // Stati per input
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    // stato per mostrare/nascondere password
    const [showPassword, setShowPassword] = useState(false);


    // Funzione di submit
    const handleLogin = async (e) => {
        e.preventDefault(); // evita il reload della pagina

        // Logica di login
        try {
            // Chiamata al backend per fare il login
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Diciamo al server che mandiamo JSON
                },
                body: JSON.stringify({
                    username, // username e psw presi dallo state React
                    password,
                }),
            });

            // Convertiamo la risposta del server da JSON a oggetto JS
            // res non contiene direttamente i dati utili, contiene solo la busta della risposta.
            // Per leggere il contenuto vero, devi convertirlo con res.json().
            const data = await res.json();

            // Se la risposta HTTP è OK (status 200–299)
            if (res.ok) {
                // Salviamo il token JWT nel browser (persistente)
                localStorage.setItem("adminToken", data.token);

                // Redirect alla dashboard admin
                window.location.href = "/";
                /* Importante: la dashboard deve leggere il token 
                dal localStorage per capire se l’utente è loggato.
                */

            } else {
                // Caso: credenziali sbagliate o errore gestito dal backend
                alert(data.message || "Errore login");
                // resetta i campi se le credenziali sono errate
                setUsername("");
                setPassword("");

            }
        } catch (err) {
            // Caso: errore tecnico (server spento, rete KO, crash fetch)
            console.error(err);
            // Messaggio generico all’utente
            alert("Errore server");
        }

    };

    return (
        <div className="login-page flex w-full flex-col items-center px-[4vw] py-10 md:min-h-dvh md:justify-center md:py-0">

            <form className="flex w-full max-w-sm flex-col gap-6" onSubmit={handleLogin}>

                <div className="relative gap-2 items-center">
                    <input
                        className="peer w-full border-0 border-b border-black/35 bg-transparent py-2 pl-12 pr-0 text-sm outline-none transition-colors focus:border-black"
                        type="text"
                        placeholder="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <User size={26}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-black/70 peer-focus:text-black" />
                </div>

                <div className="relative gap-2 items-center">
                    <input
                        className="peer w-full border-0 border-b border-black/35 bg-transparent py-2 pl-12 pr-12 text-sm outline-none transition-colors focus:border-black"
                        // Aggiunta gestione mostra/nascondi password
                        type={showPassword ? "text" : "password"}
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Lock size={26}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-black/70 peer-focus:text-black" />

                    {showPassword ? (
                        <EyeClosed
                            size={22} weight="duotone"
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-black/70 peer-focus:text-black"
                            onClick={() => setShowPassword(false)}
                        />
                    ) : (
                        <Eye size={22} weight="duotone"
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-black/70 peer-focus:text-black"
                            onClick={() => setShowPassword(true)} /> // icona per mostrare
                    )}
                </div>

                <div className="flex w-full max-w-md flex-row items-center justify-center gap-4">
                    {!!localStorage.getItem("adminToken") && (
                        <Link
                            to="/settings"
                            className="btn-primary shrink-0"
                            title="Impostazioni"
                            aria-label="Impostazioni"
                        >
                            Impostazioni
                        </Link>
                    )}
                    <button
                        type="submit"
                        className="btn-contact-submit btn-login-submit"
                    >
                        Accedi
                    </button>
                </div>

            </form>

        </div>
    );
};

export default Login;
