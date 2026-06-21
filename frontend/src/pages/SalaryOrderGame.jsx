import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "../styles/SalaryOrderGame.css";
import {
  fetchJob,
  fetchMultipleJobs,
  reportGameOver,
  startSession,
  validateOrdering,
} from "../utils/gameUtils";
import { useSound } from "../sound/SoundProvider";
import { useSettings } from "../context/SettingsContext";
import logger from "../utils/logger";

const INITIAL_OFFER_COUNT = 3;
const MOBILE_LONG_PRESS_MS = 280;

function sanitizeOffers(offers, count) {
  const seen = new Set();
  const selected = [];

  for (const offer of offers) {
    if (!offer?.id || seen.has(offer.id)) continue;
    seen.add(offer.id);
    selected.push(offer);
    if (selected.length >= count) break;
  }

  return selected;
}

function moveInArray(list, fromIndex, toIndex) {
  if (fromIndex === toIndex) return list;
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export default function SalaryOrderGame() {
  const navigate = useNavigate();
  const { play } = useSound();
  const { convertFromBase, getSalaryLabel } = useSettings();

  const [offers, setOffers] = useState([]);
  const [targetCount, setTargetCount] = useState(INITIAL_OFFER_COUNT);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roundFeedback, setRoundFeedback] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  const sessionTokenRef = useRef(null);
  const hasStartedRef = useRef(false);
  const offersRef = useRef([]);
  const rowRefs = useRef(new Map());
  const holdTimerRef = useRef(null);
  const dragRef = useRef({
    pointerId: null,
    activeId: null,
    dragging: false,
    currentIndex: -1,
    element: null,
  });

  const [draggedId, setDraggedId] = useState(null);

  const loadRoundOffers = async (count) => {
    let pool = await fetchMultipleJobs(Math.max(count * 2, 6));
    let selected = sanitizeOffers(pool, count);

    let safety = 0;
    while (selected.length < count && safety < count * 4) {
      const next = await fetchJob();
      pool = [...pool, next];
      selected = sanitizeOffers(pool, count);
      safety += 1;
    }

    if (selected.length < count) {
      throw new Error("Unable to build enough unique offers");
    }

    setOffers(selected);
    setTargetCount(count);
    setRoundFeedback(null);
    setDraggedId(null);
  };

  const startGame = async () => {
    setLoading(true);
    setGameOver(false);
    setSubmitting(false);
    setScore(0);
    setRoundFeedback(null);
    sessionTokenRef.current = null;

    try {
      const token = await startSession("ordering");
      if (!token) throw new Error("No session token");
      sessionTokenRef.current = token;
      await loadRoundOffers(INITIAL_OFFER_COUNT);
      logger.info("Salary order game started");
    } catch (err) {
      console.error(err);
      alert("Impossible de charger ce mode pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startGame();
  }, []);

  useEffect(() => {
    offersRef.current = offers;
  }, [offers]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, []);

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const finishDrag = () => {
    clearHoldTimer();
    window.removeEventListener("pointermove", handleGlobalPointerMove);
    window.removeEventListener("pointerup", handleGlobalPointerUp);
    window.removeEventListener("pointercancel", handleGlobalPointerUp);

    const wasDragging = dragRef.current.dragging;
    dragRef.current = {
      pointerId: null,
      activeId: null,
      dragging: false,
      currentIndex: -1,
      element: null,
    };
    setDraggedId(null);

    if (wasDragging) {
      play("click");
    }
  };

  const getTargetIndexFromPointer = (clientY) => {
    for (let i = 0; i < offersRef.current.length; i++) {
      const offer = offersRef.current[i];
      const row = rowRefs.current.get(offer.id);
      if (!row) continue;
      const rect = row.getBoundingClientRect();
      const middle = rect.top + rect.height / 2;
      if (clientY < middle) {
        return i;
      }
    }
    return offersRef.current.length - 1;
  };

  function handleGlobalPointerMove(event) {
    if (!dragRef.current.pointerId || dragRef.current.pointerId !== event.pointerId) return;
    if (!dragRef.current.dragging) return;

    event.preventDefault();
    const activeId = dragRef.current.activeId;
    if (!activeId) return;

    const targetIndex = getTargetIndexFromPointer(event.clientY);
    if (targetIndex === dragRef.current.currentIndex) return;

    setOffers((prev) => {
      const fromIndex = prev.findIndex((item) => item.id === activeId);
      if (fromIndex < 0) return prev;
      const boundedTarget = Math.max(0, Math.min(targetIndex, prev.length - 1));
      if (fromIndex === boundedTarget) return prev;
      dragRef.current.currentIndex = boundedTarget;
      return moveInArray(prev, fromIndex, boundedTarget);
    });
  }

  function handleGlobalPointerUp(event) {
    if (dragRef.current.pointerId && dragRef.current.pointerId !== event.pointerId) return;
    finishDrag();
  }

  const beginPointerTracking = () => {
    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: false });
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);
  };

  const startDragging = (offerId) => {
    dragRef.current.dragging = true;
    dragRef.current.activeId = offerId;
    dragRef.current.currentIndex = offersRef.current.findIndex((item) => item.id === offerId);
    setDraggedId(offerId);
  };

  const handlePointerDown = (event, offerId) => {
    if (submitting || gameOver) return;
    const pointerType = event.pointerType || "mouse";

    // Desktop uses native HTML5 drag events for better reliability.
    if (pointerType === "mouse") return;
    if (dragRef.current.pointerId) return;

    if (event.currentTarget && event.currentTarget.setPointerCapture) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture failures on unsupported environments.
      }
    }

    dragRef.current.pointerId = event.pointerId;
    dragRef.current.activeId = offerId;
    dragRef.current.currentIndex = offersRef.current.findIndex((item) => item.id === offerId);
    dragRef.current.element = event.currentTarget;
    beginPointerTracking();

    if (pointerType === "touch" || pointerType === "pen") {
      holdTimerRef.current = setTimeout(() => {
        startDragging(offerId);
      }, MOBILE_LONG_PRESS_MS);
    }
  };

  const handleDesktopDragStart = (event, offerId) => {
    if (submitting || gameOver) {
      event.preventDefault();
      return;
    }
    setDraggedId(offerId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", offerId);
  };

  const handleDesktopDragOver = (event, overOfferId) => {
    event.preventDefault();
    const activeId = draggedId;
    if (!activeId || activeId === overOfferId) return;

    setOffers((prev) => {
      const fromIndex = prev.findIndex((item) => item.id === activeId);
      const toIndex = prev.findIndex((item) => item.id === overOfferId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;
      return moveInArray(prev, fromIndex, toIndex);
    });
  };

  const handleDesktopDrop = (event) => {
    event.preventDefault();
    if (draggedId) {
      play("click");
    }
    setDraggedId(null);
  };

  const handleDesktopDragEnd = () => {
    setDraggedId(null);
  };

  const submitRound = async () => {
    if (submitting || gameOver || offers.length !== targetCount) return;
    setSubmitting(true);
    let keepLocked = false;

    try {
      const response = await validateOrdering(
        offers.map((offer) => offer.id),
        sessionTokenRef.current
      );

      if (response.correct) {
        keepLocked = true;
        play("success");
        setScore((prev) => Math.max(prev, response.round_size));
        setRoundFeedback({
          correct: true,
          roundSize: response.round_size,
        });

        setTimeout(async () => {
          try {
            await loadRoundOffers(response.next_round_size);
          } catch (err) {
            console.error(err);
            setGameOver(true);
            await reportGameOver(sessionTokenRef.current);
          } finally {
            setSubmitting(false);
          }
        }, 1000);
      } else {
        play("gameEnd");
        setScore(response.best_score || 0);
        setRoundFeedback({
          correct: false,
          sortedJobs: response.sorted_jobs || [],
        });
        setGameOver(true);
        await reportGameOver(sessionTokenRef.current);
      }
    } catch (err) {
      console.error(err);
      play("error");
    } finally {
      if (!keepLocked) {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ justifyContent: "center", alignItems: "center" }}>
        Chargement des offres...
      </div>
    );
  }

  return (
    <div className="page-wrapper so-page">
      <div className="tile-grid so-grid">
        {gameOver ? (
          <div className="tile span-12 tile-animate" style={{ animationDelay: "0.04s" }}>
            <div className="tile-content so-result-view">
              <h1>PARTIE TERMINEE</h1>
              <div className="so-final-score">{score}</div>
              <p className="so-final-sub">Nombre maximum d'offres correctement ordonnees</p>

              {roundFeedback?.sortedJobs?.length > 0 && (
                <div className="so-correct-order-box">
                  <h3>Ordre reel (du plus bas au plus haut)</h3>
                  <div className="so-order-list">
                    {roundFeedback.sortedJobs.map((entry, index) => {
                      const offer = offers.find((o) => o.id === entry.job_id);
                      return (
                        <div key={entry.job_id} className="so-order-item">
                          <span className="so-order-rank">#{index + 1}</span>
                          <span className="so-order-title">{offer?.title || "Offre"}</span>
                          <span className="so-order-salary">
                            {convertFromBase(entry.salary).toLocaleString("fr-FR")} EUR
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="hl-result-actions">
                <button className="hp-btn-primary" onClick={startGame}>Rejouer</button>
                <button className="hp-btn-secondary" onClick={() => navigate("/")}>Retour Accueil</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="tile span-12 tile-animate" style={{ animationDelay: "0.04s" }}>
              <div className="tile-content so-header no-padding">
                <div className="gp-round-badge">ORDONNER {targetCount} OFFRES</div>
                <div className="gp-score-badge">SCORE {score}</div>
              </div>
            </div>

            <div className="tile span-8 tile-grid-bg tile-animate" style={{ animationDelay: "0.08s" }}>
              <div className="tile-content so-offers-zone">
                <div className="so-order-hint so-order-less">Moins</div>
                <AnimatePresence mode="popLayout">
                  {offers.map((offer, index) => (
                    <motion.div
                      key={offer.id}
                      ref={(node) => {
                        if (node) {
                          rowRefs.current.set(offer.id, node);
                        } else {
                          rowRefs.current.delete(offer.id);
                        }
                      }}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className={`so-offer-row ${draggedId === offer.id ? "is-dragging" : ""}`}
                      draggable={!submitting && !gameOver}
                      onDragStart={(e) => handleDesktopDragStart(e, offer.id)}
                      onDragOver={(e) => handleDesktopDragOver(e, offer.id)}
                      onDrop={handleDesktopDrop}
                      onDragEnd={handleDesktopDragEnd}
                      onPointerDown={(e) => handlePointerDown(e, offer.id)}
                      onPointerUp={clearHoldTimer}
                      onPointerLeave={clearHoldTimer}
                    >
                      <div className="so-rank-chip">#{index + 1}</div>
                      <div className="so-offer-main">
                        <h3>{offer.title}</h3>
                        <div className="gp-badgeGroup">
                          <span className="gp-badge">{offer.company || "Confidentiel"}</span>
                          <span className="gp-badge">{offer.location || "France"}</span>
                          {offer.contractType && <span className="gp-badge">{offer.contractType}</span>}
                        </div>
                      </div>
                      <div className="so-drag-handle" aria-hidden="true">
                        <span>⋮⋮</span>
                        <small>Glisser</small>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div className="so-order-hint so-order-more">Plus</div>
              </div>
            </div>

            <div className="tile span-4 tile-animate" style={{ animationDelay: "0.12s" }}>
              <div className="tile-content so-action-zone">
                <p className="so-instruction">
                  Place les offres du salaire le plus bas (Moins) au salaire le plus haut (Plus).
                </p>
                <p className="so-instruction so-instruction-sub">
                  Sur mobile: appui long sur une carte puis glisser pour la deplacer.
                </p>
                <p className="so-label">Base de conversion: {getSalaryLabel()}</p>

                {roundFeedback?.correct && (
                  <div className="so-feedback success">
                    Bien joue. {roundFeedback.roundSize} offres correctement ordonnees.
                  </div>
                )}

                <button className="hp-btn-primary" onClick={submitRound} disabled={submitting}>
                  {submitting ? "Verification..." : "Valider l'ordre"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
