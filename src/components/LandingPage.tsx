"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { contactEmail, socialLinks } from "@/lib/site";
import { sports } from "@/lib/sports";

const modelColumns = [
  [
    "01",
    "HISTORICAL DATA",
    "Performance, event and competition data are transformed into model-ready features.",
    "DATA",
  ],
  [
    "02",
    "SPORT-SPECIFIC MODELS",
    "Each prediction model is developed around the structure and characteristics of its sport.",
    "ML",
  ],
  [
    "03",
    "EXPLAINABLE RESULTS",
    "Go beyond the final prediction and explore the data and factors behind the model output.",
    "OUT",
  ],
];

const pipeline = [
  ["01", "DATA INPUT", ["Historical results", "Performance metrics", "Event information"], "DATA"],
  ["02", "ML MODEL", ["Sport-specific feature engineering", "Machine learning inference"], "ML"],
  ["03", "ANALYSIS", ["Predicted ranking / outcome", "Relevant statistics", "Model explanations"], "OUT"],
] as const;

export function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const progress = Math.min(window.scrollY / Math.max(window.innerHeight * 0.9, 1), 1);
        setScrollProgress(progress);
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      className="landing platform-landing"
      style={{ "--hero-progress": scrollProgress } as CSSProperties}
    >
      <section className="platform-hero">
        <div className="platform-hero-panel platform-hero-panel-f1">
          <Image
            alt=""
            aria-hidden="true"
            className="platform-hero-image"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 58vw"
            src="/UFC/f1_hero.png"
          />
        </div>
        <div className="platform-hero-panel platform-hero-panel-ufc">
          <Image
            alt=""
            aria-hidden="true"
            className="platform-hero-image"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 42vw"
            src="/UFC/ufc_hero.png"
          />
        </div>
        <div className="platform-hero-overlay" />
        <div className="platform-hero-grid" />

        <div className="platform-hero-content reveal">
          <p className="tech-label">AI SPORTS PREDICTIONS</p>
          <h1>
            Data-driven predictions.
            <span>Built for competition.</span>
          </h1>
          <p>
            Machine learning models that analyze real-world performance data to generate rankings,
            matchup predictions and explainable insights.
          </p>
          <div className="platform-hero-actions">
            <Link className="red-cta" href="/f1">
              Explore Formula 1 <span>→</span>
            </Link>
            <Link className="button-secondary" href="/ufc">
              Explore UFC <span>→</span>
            </Link>
          </div>
          <small>FORMULA 1  •  UFC</small>
        </div>

        <div className="platform-hero-metric metric-f1" aria-hidden="true">
          <span>SPEED</span>
          <span>DATA</span>
          <span>PRECISION</span>
        </div>
        <div className="platform-hero-metric metric-ufc" aria-hidden="true">
          <span>SKILL</span>
          <span>STRATEGY</span>
          <span>DISCIPLINE</span>
        </div>
      </section>

      <section className="landing-section sport-selector-section" id="models">
        <div className="section-heading reveal">
          <div>
            <p className="tech-label">MODELS</p>
            <h2>Choose your sport</h2>
            <p>
              Each sport uses a model designed around its own data, performance indicators and
              competitive structure.
            </p>
          </div>
        </div>
        <div className="sport-card-grid">
          {sports.map((sport) => (
            <Link
              className="sport-card reveal"
              href={sport.href}
              key={sport.href}
              style={{ "--sport-accent": sport.accent } as CSSProperties}
            >
              <div className="sport-card-visual">
                <Image alt="" fill sizes="(max-width: 760px) 100vw, 50vw" src={sport.heroImage} />
              </div>
              <div className="sport-card-body">
                <p>{sport.name.toUpperCase()}</p>
                <h3>{sport.shortName === "F1" ? "AI Race Predictions" : "AI Fight Predictions"}</h3>
                <span>
                  {sport.shortName === "F1"
                    ? "Analyze drivers, constructors, circuits, qualifying performance and historical race data."
                    : "Analyze fighter performance, styles, matchup characteristics and historical fight data."}
                </span>
                <div className="sport-tags">
                  {sport.tags.map((tag) => (
                    <i key={tag}>{tag}</i>
                  ))}
                </div>
                <strong>
                  Explore {sport.name} <em>→</em>
                </strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-section model-difference-section" id="about">
        <div className="model-difference-copy reveal">
          <h2>
            One platform.
            <span>Different models.</span>
          </h2>
          <p>
            Every sport behaves differently. GRDX1 uses sport-specific machine learning models
            instead of applying the same prediction logic everywhere.
          </p>
        </div>
        <div className="model-principles">
          {modelColumns.map(([number, title, body, icon]) => (
            <article className="model-principle reveal" key={number}>
              <div>
                <span>{number}</span>
                <b aria-hidden="true">{icon}</b>
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section pipeline-section" id="how-it-works">
        <div className="pipeline-heading reveal">
          <p className="tech-label">THE PROCESS</p>
          <h2>How GRDX1 works</h2>
          <p>From real-world data to model-driven insights.</p>
        </div>
        <div className="pipeline-flow">
          {pipeline.map(([number, label, items, symbol], index) => (
            <article className="pipeline-step reveal" key={number}>
              <span aria-hidden="true">{symbol}</span>
              <small>{number}</small>
              <h3>{label}</h3>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {index < pipeline.length - 1 ? <b aria-hidden="true">→</b> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section about-contact-section" id="who-we-are">
        <div className="about-copy reveal">
          <p className="tech-label">WHO WE ARE</p>
          <h2>We are building the sports analysis tools we wanted to use.</h2>
          <p>
            GRDX1 is an independent sports analytics project that develops machine-learning models
            to analyze competitive data and generate model-driven predictions, rankings and
            explainable analysis.
          </p>
          <p>
            GRDX1 is not affiliated with Formula 1, UFC, their governing bodies, teams,
            promotions, athletes or official organizations. Each model is built as an independent
            data experiment.
          </p>
        </div>

        <div className="contact-panel reveal" id="contact">
          <p className="tech-label">CONTACT</p>
          <h2>Come hang out with us.</h2>
          <p>For general questions, feedback, or business inquiries, reach out here:</p>
          <p>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
          <p>We also post updates, experiments, analysis, and whatever we are building next.</p>
          <div className="social-links" aria-label="GRDX1 social links">
            {socialLinks.map((item) => (
              <a href={item.href} key={item.label} rel="noreferrer" target="_blank">
                {item.label} <span>↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="platform-positioning">
        <Image
          alt=""
          aria-hidden="true"
          className="positioning-track"
          fill
          sizes="100vw"
          src="/UFC/pista_esquina_inferior_izquierda.png"
        />
        <Image
          alt=""
          aria-hidden="true"
          className="positioning-cage"
          fill
          sizes="100vw"
          src="/UFC/jaula_esquina_inferior_derecha.png"
        />
        <div className="positioning-content reveal">
          <p className="tech-label">BUILT AROUND THE DATA</p>
          <h2>
            Not picks.
            <br />
            Not betting advice.
            <br />
            <span>Model-driven analysis.</span>
          </h2>
          <p>
            GRDX1 is an experimental sports analytics platform that uses historical and
            event-specific data to explore how machine learning can analyze competitive sports.
          </p>
          <a className="button-secondary" href="#models">
            Explore the models <span>→</span>
          </a>
        </div>
      </section>
    </div>
  );
}
