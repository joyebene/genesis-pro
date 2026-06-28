import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, getDocs, addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  date: string;
  status: string;
  note: string;
}

interface WithdrawalRequest {
  id: string | number;
  amount: number;
  wallet: string;
  coin: string;
  date: string;
  status: "pending" | "approved" | "rejected";
}

interface Client {
  id: string;
  name: string;
  email: string;
  password: string;
  package: string;
  balance: number;
  totalDeposit: number;
  totalWithdrawn: number;
  totalProfit: number;
  roi: number | string;
  transactions: Transaction[];
  withdrawalRequests: WithdrawalRequest[];
  installments: any[];
  joined: string;
}
interface FormData {
  name?: string;
  email?: string;
  password?: string;
  package?: string;
  amount?: number;
  wallet?: string;
  coin?: string;
}

interface Toast {
  msg: string;
  ok: boolean;
}



// ─── Data ─────────────────────────────────────────────────────────
const PACKAGES = [
  { id: "silver", name: "Silver", min: 12000, color: "#C0C0C0", weekly: "12–16%", icon: "🥈", desc: "Ideal for steady, consistent weekly growth." },
  { id: "gold", name: "Gold", min: 15000, color: "#C9A84C", weekly: "16–20%", icon: "🥇", desc: "Our most popular plan for serious investors.", popular: true },
  { id: "diamond", name: "Diamond", min: 20000, color: "#B9F2FF", weekly: "20–25%", icon: "💎", desc: "Maximum returns for high-net-worth investors." },
];

type Wallet = {
  address: string;
  network: string;
};

const WALLETS: Record<string, Wallet> = {
  BTC: { address: "bc1qeyflc5pe6n5ufzwwmsj9336z7gglrjv2w3fhmu", network: "Bitcoin Network" },
  ETH: { address: "0x195B3B5437D36839de838d27690E99B087FC9dC6", network: "ERC-20" },
  USDT: { address: "0x195B3B5437D36839de838d27690E99B087FC9dC6", network: "ERC-20" },
};

const TESTIMONIALS = [
  { name: "Michael R.", location: "New York, USA", pkg: "Gold", amount: "$15,000", return_: "+18%", text: "GenesisProLtd has completely changed how I think about passive income. My portfolio has grown consistently every single week. The transparency and weekly updates are unmatched.", stars: 5, avatar: "MR" },
  { name: "Sarah L.", location: "London, UK", pkg: "Diamond", amount: "$20,000", return_: "+23%", text: "I was skeptical at first, but after my first weekly update showing real profits, I was hooked. The team is professional and my money is always working hard for me.", stars: 5, avatar: "SL" },
  { name: "James O.", location: "Toronto, Canada", pkg: "Silver", amount: "$12,000", return_: "+14%", text: "Starting with the Silver plan was the best financial decision I made this year. Consistent weekly profits, fast support, and a clean dashboard to track everything.", stars: 5, avatar: "JO" },
  { name: "Amanda K.", location: "Chicago, USA", pkg: "Gold", amount: "$15,000", return_: "+19%", text: "My ROI has been incredible. I've already referred three colleagues to GenesisProLtd. The agricultural and crypto diversification gives me confidence my funds are safe.", stars: 5, avatar: "AK" },
  { name: "Pierre D.", location: "Paris, France", pkg: "Diamond", amount: "$20,000", return_: "+22%", text: "After years of average returns from traditional banks, GenesisProLtd delivers real results. Weekly profits, zero hidden fees, and a world-class team managing my investment.", stars: 5, avatar: "PD" },
  { name: "David M.", location: "Houston, USA", pkg: "Silver", amount: "$12,000", return_: "+13%", text: "The installment deposit option made it easy for me to start without committing everything at once. Now I'm fully invested and loving the weekly returns.", stars: 5, avatar: "DM" },
];

const FEATURES = [
  {
    id: "crypto", icon: "₿", title: "Cryptocurrency Trading", color: "#F7931A",
    points: ["Live trading on BTC, ETH, and major altcoins", "24/7 crypto market exposure", "Diversified across top 10 digital assets", "Automated risk management protocols", "Weekly crypto profit distributions"],
    desc: "We actively trade the world's leading cryptocurrencies using proven technical and fundamental strategies, capturing gains in both bull and bear market conditions."
  },
  {
    id: "forex", icon: "📈", title: "Forex Trading", color: "#00C896",
    points: ["Major & minor currency pairs (EUR/USD, GBP/USD, XAUUSD)", "Monday to Friday live market execution", "10+ years of professional trading experience", "Stop-loss and risk management on every trade", "Weekly profit updates every weekend"],
    desc: "Our experienced forex traders navigate the world's largest financial market — $7.5 trillion daily — to generate consistent weekly returns for all investors."
  },
  {
    id: "gold", icon: "🥇", title: "Gold & Commodities", color: "#C9A84C",
    points: ["XAUUSD gold trading — a proven safe-haven asset", "Oil, silver, and commodity futures", "Hedge against inflation and market volatility", "Long and short positions for maximum opportunity", "Consistent returns regardless of market direction"],
    desc: "Gold has been the world's most reliable store of value for centuries. We trade XAUUSD and other commodities to protect and grow your wealth in any market environment."
  },
  {
    id: "stocks", icon: "📊", title: "Stocks & Equities", color: "#3B82F6",
    points: ["US and international stock markets", "S&P 500, NASDAQ, and blue-chip stocks", "Swing and position trading strategies", "Dividend-generating portfolio management", "Quarterly earnings season opportunities"],
    desc: "Our equity traders capitalize on global stock market movements, from US tech giants to international blue-chip companies, delivering consistent equity-based returns."
  },
  {
    id: "agro", icon: "🌾", title: "Agricultural Investments", color: "#22C55E",
    points: ["Direct farm investment managed in-house", "Crop cycles: maize, cassava, soybeans & more", "Steady returns tied to real harvest cycles", "Community updates on farm performance", "Low-volatility alternative to financial markets"],
    desc: "Our agricultural division invests directly in high-yield farming operations. Clients enjoy steady, real-world returns from harvest cycles, fully managed by our in-house agricultural team."
  },
];



// ─── Utilities ────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtD = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// ─── Styles ───────────────────────────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', system-ui, sans-serif; background: #060C1A; color: #E8EAF0; }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111827; } ::-webkit-scrollbar-thumb { background: #C9A84C44; border-radius: 3px; }

  /* Ticker */
  .ticker { background: #0D1526; border-bottom: 1px solid #C9A84C22; padding: 9px 0; overflow: hidden; white-space: nowrap; }
  .ticker-track { display: inline-flex; animation: tick 35s linear infinite; gap: 0; }
  .ticker-track:hover { animation-play-state: paused; }
  @keyframes tick { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .ticker-item { padding: 0 28px; font-size: 12.5px; font-weight: 500; color: #C9A84C; letter-spacing: 0.3px; border-right: 1px solid #C9A84C22; }
  .ticker-item span { color: #00C896; margin-left: 6px; }

  /* Nav */
  .nav { background: #0D152688; backdrop-filter: blur(12px); border-bottom: 1px solid #1E2A4033; padding: 18px 40px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
  .logo { font-size: 20px; font-weight: 800; color: #C9A84C; letter-spacing: -0.5px; cursor: pointer; }
  .logo em { color: #E8EAF0; font-style: normal; }
  .nav-links { display: flex; gap: 28px; }
  .nav-link { color: #8B93A7; font-size: 14px; font-weight: 500; cursor: pointer; transition: color 0.2s; border: none; background: none; }
  .nav-link:hover { color: #C9A84C; }
  .nav-actions { display: flex; gap: 10px; }

  /* Buttons */
  .btn { padding: 11px 24px; border-radius: 7px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; font-family: inherit; }
  .btn-gold { background: linear-gradient(135deg, #C9A84C, #E8C96C); color: #0A0F1E; }
  .btn-gold:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 24px #C9A84C33; }
  .btn-outline { background: transparent; border: 1px solid #C9A84C55; color: #C9A84C; }
  .btn-outline:hover { background: #C9A84C11; }
  .btn-ghost { background: transparent; color: #8B93A7; border: 1px solid #1E2A40; }
  .btn-ghost:hover { background: #1E2A40; color: #E8EAF0; }
  .btn-green { background: linear-gradient(135deg, #00C896, #00A87A); color: #fff; }
  .btn-green:hover { opacity: 0.9; transform: translateY(-1px); }
  .btn-sm { padding: 7px 16px; font-size: 13px; }
  .btn-full { width: 100%; }
  .btn-danger { background: #FF4444; color: #fff; }

  /* Hero */
  .hero { padding: 90px 40px 80px; background: radial-gradient(ellipse at 50% -10%, #1A3060 0%, #060C1A 65%); text-align: center; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
  .hero-tag { color: #00C896; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px; }
  .hero h1 { font-size: clamp(34px, 5.5vw, 62px); font-weight: 800; line-height: 1.08; margin-bottom: 22px; letter-spacing: -1px; }
  .hero h1 span { color: #C9A84C; }
  .hero-sub { color: #8B93A7; font-size: 17px; max-width: 540px; margin: 0 auto 38px; line-height: 1.7; }
  .hero-cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .hero-stats { display: flex; gap: 0; justify-content: center; margin-top: 64px; flex-wrap: wrap; border: 1px solid #1E2A40; border-radius: 14px; background: #0D1526; overflow: hidden; max-width: 700px; margin-left: auto; margin-right: auto; }
  .hero-stat { flex: 1; min-width: 140px; padding: 24px 20px; border-right: 1px solid #1E2A40; text-align: center; }
  .hero-stat:last-child { border-right: none; }
  .hero-stat-num { font-size: 26px; font-weight: 800; color: #C9A84C; }
  .hero-stat-label { font-size: 12px; color: #8B93A7; margin-top: 4px; font-weight: 500; }

  /* Sections */
  .section { padding: 80px 40px; max-width: 1140px; margin: 0 auto; }
  .section-tag { color: #C9A84C; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; }
  .section-title { font-size: clamp(24px, 3vw, 36px); font-weight: 800; margin-bottom: 10px; letter-spacing: -0.5px; }
  .section-sub { color: #8B93A7; font-size: 15px; line-height: 1.7; max-width: 560px; margin-bottom: 48px; }
  .section-dark { background: #0D1526; border-top: 1px solid #1E2A40; border-bottom: 1px solid #1E2A40; }

  /* Packages */
  .pkg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 22px; }
  .pkg-card { background: #0D1526; border: 1px solid #1E2A40; border-radius: 16px; padding: 32px 26px; position: relative; overflow: hidden; transition: all 0.25s; cursor: default; }
  .pkg-card:hover { transform: translateY(-5px); border-color: #C9A84C44; box-shadow: 0 20px 60px #00000055; }
  .pkg-card.popular { border-color: #C9A84C66; background: linear-gradient(145deg, #131F38, #0D1526); }
  .pkg-badge { position: absolute; top: 0; right: 0; background: linear-gradient(135deg, #C9A84C, #E8C96C); color: #0A0F1E; font-size: 10px; font-weight: 800; padding: 5px 14px; border-radius: 0 16px 0 10px; letter-spacing: 1px; text-transform: uppercase; }
  .pkg-icon { font-size: 36px; margin-bottom: 16px; }
  .pkg-name { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
  .pkg-min { color: #8B93A7; font-size: 13px; margin-bottom: 20px; }
  .pkg-return { font-size: 40px; font-weight: 800; color: #00C896; line-height: 1; margin-bottom: 4px; }
  .pkg-freq { font-size: 12px; color: #8B93A7; margin-bottom: 20px; }
  .pkg-divider { border: none; border-top: 1px solid #1E2A40; margin: 20px 0; }
  .pkg-feature { font-size: 13px; color: #8B93A7; padding: 5px 0; display: flex; align-items: center; gap: 8px; }
  .pkg-feature::before { content: '✓'; color: #00C896; font-weight: 700; }

  /* Features */
  .feat-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 32px; }
  .feat-tab { padding: 10px 20px; border-radius: 8px; border: 1px solid #1E2A40; background: transparent; color: #8B93A7; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
  .feat-tab.active { background: #C9A84C; color: #0A0F1E; border-color: #C9A84C; }
  .feat-content { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
  .feat-points { list-style: none; }
  .feat-point { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #1E2A4033; }
  .feat-point:last-child { border-bottom: none; }
  .feat-point-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; margin-top: 1px; }
  .feat-desc { font-size: 15px; color: #8B93A7; line-height: 1.8; margin-bottom: 24px; }
  .feat-visual { background: #0D1526; border: 1px solid #1E2A40; border-radius: 16px; padding: 32px; text-align: center; }
  .feat-big-icon { font-size: 80px; margin-bottom: 16px; }
  .feat-visual-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .feat-visual-sub { color: #8B93A7; font-size: 14px; }

  /* Testimonials */
  .testi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
  .testi-card { background: #0D1526; border: 1px solid #1E2A40; border-radius: 14px; padding: 28px; transition: transform 0.2s; }
  .testi-card:hover { transform: translateY(-3px); }
  .testi-stars { color: #C9A84C; font-size: 14px; margin-bottom: 14px; letter-spacing: 2px; }
  .testi-text { color: #C8CADC; font-size: 14px; line-height: 1.75; margin-bottom: 20px; font-style: italic; }
  .testi-author { display: flex; align-items: center; gap: 12px; }
  .testi-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #C9A84C, #E8C96C); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #0A0F1E; flex-shrink: 0; }
  .testi-name { font-weight: 700; font-size: 14px; }
  .testi-meta { color: #8B93A7; font-size: 12px; margin-top: 2px; }
  .testi-badge { margin-left: auto; background: #00C89622; color: #00C896; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }

  /* About */
  .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .about-values { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 32px; }
  .about-value { background: #060C1A; border: 1px solid #1E2A40; border-radius: 10px; padding: 18px; }
  .about-value-icon { font-size: 22px; margin-bottom: 8px; }
  .about-value-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
  .about-value-desc { color: #8B93A7; font-size: 12px; line-height: 1.6; }
  .vision-box { background: linear-gradient(135deg, #131F38, #0D1526); border: 1px solid #C9A84C33; border-radius: 16px; padding: 32px; margin-bottom: 20px; }
  .vision-label { color: #C9A84C; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
  .vision-text { font-size: 17px; line-height: 1.7; font-weight: 500; }
  .mission-box { background: #0D1526; border: 1px solid #1E2A40; border-radius: 16px; padding: 28px; }

  /* Dashboard */
  .dash { min-height: 100vh; background: #060C1A; }
  .dash-nav { background: #0D1526; border-bottom: 1px solid #1E2A40; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; }
  .dash-body { max-width: 1100px; margin: 0 auto; padding: 32px; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 28px; }
  .stat-card { background: #0D1526; border: 1px solid #1E2A40; border-radius: 12px; padding: 20px; }
  .stat-label { color: #8B93A7; font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-val { font-size: 22px; font-weight: 800; }
  .stat-sub { color: #8B93A7; font-size: 12px; margin-top: 4px; }
  .tabs { display: flex; gap: 4px; background: #0D1526; border: 1px solid #1E2A40; border-radius: 9px; padding: 4px; margin-bottom: 24px; flex-wrap: wrap; }
  .tab { padding: 9px 18px; border-radius: 7px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; background: transparent; color: #8B93A7; transition: all 0.2s; font-family: inherit; }
  .tab.active { background: #1A2A48; color: #C9A84C; }
  .card { background: #0D1526; border: 1px solid #1E2A40; border-radius: 12px; padding: 22px; }
  .tx-table { width: 100%; border-collapse: collapse; }
  .tx-table th { text-align: left; padding: 11px 14px; font-size: 11px; color: #8B93A7; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; border-bottom: 1px solid #1E2A40; }
  .tx-table td { padding: 13px 14px; font-size: 14px; border-bottom: 1px solid #1E2A4022; }
  .badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .b-confirmed { background: #00C89622; color: #00C896; }
  .b-pending { background: #C9A84C22; color: #C9A84C; }
  .b-deposit { background: #3B82F622; color: #3B82F6; }
  .b-profit { background: #00C89622; color: #00C896; }
  .b-withdrawal { background: #FF444422; color: #FF4444; }
  .roi-bar { height: 5px; background: #1E2A40; border-radius: 3px; margin-top: 8px; overflow: hidden; }
  .roi-fill { height: 100%; background: linear-gradient(90deg, #C9A84C, #00C896); border-radius: 3px; }

  /* Auth */
  .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: radial-gradient(ellipse at 50% 0%, #1A3060 0%, #060C1A 70%); }
  .auth-box { width: 100%; max-width: 420px; background: #0D1526; border: 1px solid #1E2A40; border-radius: 16px; padding: 36px; }
  .form-group { margin-bottom: 18px; }
  .form-label { display: block; font-size: 12px; font-weight: 700; color: #8B93A7; margin-bottom: 7px; letter-spacing: 0.5px; text-transform: uppercase; }
  .form-input { width: 100%; padding: 12px 16px; background: #060C1A; border: 1px solid #1E2A40; border-radius: 8px; color: #E8EAF0; font-size: 15px; outline: none; transition: border 0.2s; font-family: inherit; }
  .form-input:focus { border-color: #C9A84C; }
  .form-error { color: #FF6666; font-size: 13px; margin-top: 6px; }

  /* Modal */
  .overlay { position: fixed; inset: 0; background: #00000099; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal { background: #0D1526; border: 1px solid #1E2A40; border-radius: 18px; padding: 32px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
  .modal h2 { font-size: 20px; font-weight: 800; margin-bottom: 22px; }
  .wallet-box { background: #060C1A; border: 1px solid #1E2A40; border-radius: 8px; padding: 13px 16px; font-family: monospace; font-size: 12.5px; color: #C9A84C; word-break: break-all; margin-top: 8px; }
  .copy-btn { background: #1E2A40; border: none; color: #8B93A7; padding: 5px 12px; border-radius: 5px; font-size: 12px; cursor: pointer; margin-top: 8px; font-family: inherit; }
  .copy-btn:hover { background: #C9A84C; color: #0A0F1E; }

  /* Installment */
  .install-opts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .install-opt { border: 1px solid #1E2A40; border-radius: 10px; padding: 14px 10px; text-align: center; cursor: pointer; transition: all 0.2s; background: #060C1A; }
  .install-opt:hover { border-color: #C9A84C55; }
  .install-opt.selected { border-color: #C9A84C; background: #C9A84C11; }
  .install-opt-num { font-size: 20px; font-weight: 800; color: #C9A84C; }
  .install-opt-label { font-size: 11px; color: #8B93A7; margin-top: 3px; }
  .install-schedule { background: #060C1A; border: 1px solid #1E2A40; border-radius: 10px; padding: 16px; margin-top: 12px; }
  .install-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1E2A4033; font-size: 13px; }
  .install-row:last-child { border-bottom: none; }

  /* Admin */
  .admin-layout { display: flex; min-height: 100vh; }
  .sidebar { width: 220px; background: #0D1526; border-right: 1px solid #1E2A40; padding: 24px 14px; position: fixed; top: 0; bottom: 0; overflow-y: auto; }
  .admin-body { margin-left: 220px; padding: 32px; min-height: 100vh; background: #060C1A; }
  .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; color: #8B93A7; transition: all 0.2s; margin-bottom: 3px; border: none; background: none; font-family: inherit; width: 100%; }
  .sidebar-item:hover, .sidebar-item.active { background: #1A2A48; color: #C9A84C; }
  .client-card { background: #0D1526; border: 1px solid #1E2A40; border-radius: 12px; margin-bottom: 14px; overflow: hidden; }
  .client-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; cursor: pointer; }
  .client-body { padding: 0 20px 20px; border-top: 1px solid #1E2A40; }

  /* Toast */
  .toast { position: fixed; bottom: 24px; right: 24px; z-index: 300; padding: 14px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 8px 32px #00000066; max-width: 320px; animation: fadeUp 0.3s ease; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* Footer */
  .footer { background: #0D1526; border-top: 1px solid #1E2A40; padding: 48px 40px 28px; }
  .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; max-width: 1140px; margin: 0 auto 40px; }
  .footer-bottom { max-width: 1140px; margin: 0 auto; border-top: 1px solid #1E2A40; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; color: #8B93A7; font-size: 13px; flex-wrap: wrap; gap: 8px; }
  .footer-col-title { font-size: 12px; font-weight: 700; color: #C9A84C; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 14px; }
  .footer-link { color: #8B93A7; font-size: 13px; margin-bottom: 10px; cursor: pointer; display: block; transition: color 0.2s; }
  .footer-link:hover { color: #C9A84C; }

  /* Utils */
  .green { color: #00C896; } .gold { color: #C9A84C; } .muted { color: #8B93A7; } .red { color: #FF6666; }
  .empty { text-align: center; padding: 48px; color: #8B93A7; }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }

  @media (max-width: 900px) {
    .nav-links { display: none; }
    .nav { padding: 14px 20px; }
    .section { padding: 56px 20px; }
    .hero { padding: 60px 20px 50px; }
    .about-grid { grid-template-columns: 1fr; }
    .feat-content { grid-template-columns: 1fr; }
    .footer-grid { grid-template-columns: 1fr 1fr; }
    .sidebar { display: none; }
    .admin-body { margin-left: 0; padding: 20px 16px; }
    .dash-body { padding: 20px 16px; }
  }
  @media (max-width: 600px) {
    .hero h1 { font-size: 30px; }
    .install-opts { grid-template-columns: 1fr; }
    .footer-grid { grid-template-columns: 1fr; }
    .about-values { grid-template-columns: 1fr; }
  }
`;

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("home");
  const [clients, setClients] = useState<Client[]>([]);
  const [user, setUser] = useState<Client | null>(null);
  const [modal, setModal] = useState<"deposit" | "withdraw" | null>(null);
  const [dashTab, setDashTab] = useState("overview");
  const [adminTab, setAdminTab] = useState("clients");
  const [form, setForm] = useState<FormData>({});
  const [err, setErr] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [coin, setCoin] = useState("USDT");
  const [copied, setCopied] = useState(false);
  const [installments, setInstallments] = useState(1);
  const [featTab, setFeatTab] = useState("crypto");
  const [, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const go = (v: string) => { setView(v); setErr(""); setForm({}); setMobileMenu(false); window.scrollTo(0, 0); };
  const notify = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };
  const copy = (txt: string) => { navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const currentUser = () => {
    if (!user) return null;
    return clients.find(c => c.id === user.id) || user;
  };

  // Fetch Clients
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const clientsCollection = collection(db, "clients");
        const clientSnapshot = await getDocs(clientsCollection);
        const clientList = clientSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Client, 'id'>
        })) as Client[];
        setClients(clientList);
      } catch (error) {
        console.error("Error fetching clients: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Login
  const login = () => {
    if (form.email === "admin@genesispro.com" && form.password === "admin2024") { go("admin"); return; }
    const c = clients.find(c => c.email === form.email && c.password === form.password);
    if (c) { setUser(c); go("dashboard"); } else setErr("Invalid email or password.");
  };

  // Register
  const register = async () => {
    if (!form.name || !form.email || !form.password || !form.package) {
      setErr("All fields are required.");
      return;
    }

    // Check if email exists
    const existing = clients.find(c => c.email === form.email);
    if (existing) {
      setErr("Email already registered.");
      return;
    }

    try {
      const newClient: Omit<Client, 'id'> = {
        name: form.name,
        email: form.email,
        password: form.password, // ⚠️ In production, use Firebase Auth + hash password!
        package: form.package,
        balance: 0,
        totalDeposit: 0,
        totalWithdrawn: 0,
        totalProfit: 0,
        roi: "0",
        transactions: [],
        withdrawalRequests: [],
        installments: [],
        joined: new Date().toISOString().split("T")[0],
      };

      const docRef = await addDoc(collection(db, "clients"), newClient);

      const createdClient: Client = { id: docRef.id, ...newClient };

      setClients(prev => [...prev, createdClient]);
      setUser(createdClient);
      go("dashboard");
      notify("Welcome to GenesisProLtd! Your account is ready.");
    } catch (error) {
      console.error(error);
      setErr("Failed to create account.");
    }
  };

  const refreshClients = async () => {
    try {
      const clientsCollection = collection(db, "clients");
      const snapshot = await getDocs(clientsCollection);
      const updatedList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Client, 'id'>
      })) as Client[];
      setClients(updatedList);
    } catch (e) {
      console.error(e);
    }
  };

  // Withdraw
  const withdraw = async () => {
    const cu = currentUser();
    if (!cu) return;

    if (!form.amount || isNaN(form.amount) || +form.amount <= 0) {
      setErr("Enter a valid amount.");
      return;
    }
    if (+form.amount > cu.balance) {
      setErr("Insufficient balance.");
      return;
    }
    if (!form.wallet) {
      setErr("Enter your wallet address.");
      return;
    }

    const req: WithdrawalRequest = {
      id: Date.now(),
      amount: +form.amount,
      wallet: form.wallet,
      coin: form.coin || "USDT",
      date: new Date().toISOString().split("T")[0],
      status: "pending"
    };

    const newTransaction: Transaction = {
      id: Date.now(),
      type: "withdrawal",
      amount: req.amount,
      date: req.date,
      status: "pending",
      note: `Withdrawal to ${req.wallet.slice(0, 14)}...`
    };

    const clientRef = doc(db, "clients", cu.id);

    try {
      await updateDoc(clientRef, {
        withdrawalRequests: [...cu.withdrawalRequests, req],
        transactions: [...cu.transactions, newTransaction]
      });

      // Update local state
      setClients(p => p.map(c =>
        c.id === cu.id
          ? {
            ...c,
            withdrawalRequests: [...c.withdrawalRequests, req],
            transactions: [...c.transactions, newTransaction]
          }
          : c
      ));

      setModal(null);
      setForm({});
      notify("Withdrawal request submitted. We'll process it shortly.");
    } catch (error) {
      console.error(error);
      notify("Failed to submit withdrawal request.", false);
    }
  };

  // Admin update
  const adminUpdate = async (cid: string, amount: number, type: "deduct" | "profit" | "deposit") => {
    if (isNaN(amount) || amount <= 0) return;

    const clientRef = doc(db, "clients", cid);
    const client = clients.find(c => c.id === cid);
    if (!client) return;

    let newBalance = client.balance;
    let newTotalDeposit = client.totalDeposit;
    let newTotalProfit = client.totalProfit;

    if (type === "deduct") newBalance = Math.max(0, newBalance - amount);
    else if (type === "deposit") {
      newBalance += amount;
      newTotalDeposit += amount;
    } else if (type === "profit") {
      newBalance += amount;
      newTotalProfit += amount;
    }

    const newRoi = newTotalDeposit > 0 ? ((newTotalProfit / newTotalDeposit) * 100).toFixed(1) : "0";

    const newTransaction = {
      id: Date.now(),
      type,
      amount,
      date: new Date().toISOString().split("T")[0],
      status: "confirmed",
      note: `Admin ${type} update`
    };

    try {
      await updateDoc(clientRef, {
        balance: newBalance,
        totalDeposit: newTotalDeposit,
        totalProfit: newTotalProfit,
        roi: newRoi,
        transactions: [...client.transactions, newTransaction]
      });

      // Refresh local state
      setClients(prev => prev.map(c =>
        c.id === cid ? {
          ...c,
          balance: newBalance,
          totalDeposit: newTotalDeposit,
          totalProfit: newTotalProfit,
          roi: newRoi,
          transactions: [...c.transactions, newTransaction]
        } : c
      ));

      notify("Balance updated successfully.");
      refreshClients();
    } catch (e) {
      console.error(e);
    }
  };

  // Admin approve withdrawal
  const approveWithdrawal = async (cid: string, rid: string | number) => {
    const client = clients.find(c => c.id === cid);
    if (!client) return;

    const request = client.withdrawalRequests.find(r => String(r.id) === String(rid));
    if (!request || request.status !== "pending") return;

    const clientRef = doc(db, "clients", cid);

    try {
      const newBalance = client.balance - request.amount;
      const newTotalWithdrawn = client.totalWithdrawn + request.amount;

      const updatedWithdrawalRequests = client.withdrawalRequests.map(r =>
        String(r.id) === String(rid) ? { ...r, status: "approved" } : r
      );

      const updatedTransactions = client.transactions.map(t =>
        t.amount === request.amount && t.status === "pending"
          ? { ...t, status: "confirmed" }
          : t
      );

      await updateDoc(clientRef, {
        balance: newBalance,
        totalWithdrawn: newTotalWithdrawn,
        withdrawalRequests: updatedWithdrawalRequests,
        transactions: updatedTransactions,
      });

      setClients(prev =>
        prev.map(c =>
          c.id === cid
            ? {
              ...c,
              balance: newBalance,
              totalWithdrawn: newTotalWithdrawn,
              withdrawalRequests: updatedWithdrawalRequests,
              transactions: updatedTransactions,
            } as Client
            : c
        )
      );

      notify("Withdrawal approved successfully.");
      refreshClients();
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      notify("Failed to approve withdrawal.", false);
    }
  };

  // Installment schedule
  const getSchedule = (pkg: string, n: number) => {
    const p = PACKAGES.find(p => p.id === pkg);
    if (!p) return [];
    const each = p.min / n;
    return Array.from({ length: n }, (_, i) => ({ num: i + 1, amount: each, due: `Week ${i + 1}` }));
  };

  const feat = FEATURES.find(f => f.id === featTab);
  const cu = currentUser();

  // ── TICKER DATA
  const tickers = ["BTC $67,420 ▲0.8%", "ETH $3,812 ▲1.2%", "GOLD $2,341/oz ▲0.4%", "XAUUSD ▲0.42%", "EUR/USD 1.0842", "GBP/USD 1.2654", "S&P500 5,248 ▲0.3%", "OIL $78.45 ▼0.2%", "BNB $598 ▲0.9%", "USDT $1.00", "SOL $178 ▲2.1%"];

  return (
    <>
      <style>{S}</style>
      {loading && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(6, 12, 26, 0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          flexDirection: "column",
          color: "#C9A84C",
          fontSize: "18px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          Loading GenesisProLtd...
        </div>
      )}
      {toast && <div className="toast" style={{ background: toast.ok ? "#00C896" : "#FF4444", color: "#fff" }}>{toast.msg}</div>}

      {/* DEPOSIT MODAL */}
      {modal === "deposit" && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>💰 Make a Deposit</h2>
            <div className="form-group">
              <label className="form-label">Your Package</label>
              <div style={{ background: "#060C1A", border: "1px solid #1E2A40", borderRadius: 8, padding: "12px 16px", color: "#C9A84C", fontWeight: 700 }}>
                {PACKAGES.find(p => p.id === cu?.package)?.name} — Min. {fmt(PACKAGES.find(p => p.id === cu?.package)?.min || 0)}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Plan</label>
              <p style={{ color: "#8B93A7", fontSize: 13, marginBottom: 12 }}>Choose how many installments you'd like to split your deposit into:</p>
              <div className="install-opts">
                {[1, 2, 3].map(n => (
                  <div key={n} className={`install-opt ${installments === n ? "selected" : ""}`} onClick={() => setInstallments(n)}>
                    <div className="install-opt-num">{n}×</div>
                    <div className="install-opt-label">{n === 1 ? "Full Payment" : n === 2 ? "2 Installments" : "3 Installments"}</div>
                  </div>
                ))}
              </div>
              {cu?.package && (
                <div className="install-schedule">
                  <p style={{ color: "#8B93A7", fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>Payment Schedule</p>
                  {getSchedule(cu.package, installments).map(s => (
                    <div key={s.num} className="install-row">
                      <span className="muted">Payment {s.num} — {s.due}</span>
                      <span style={{ fontWeight: 700, color: "#C9A84C" }}>{fmt(s.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Select Cryptocurrency</label>
              <select className="form-input" value={coin} onChange={e => setCoin(e.target.value)}>
                <option value="USDT">USDT (ERC-20)</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Send to this wallet</label>
              <div className="wallet-box">{WALLETS[coin].address}</div>
              <div style={{ fontSize: 12, color: "#8B93A7", marginTop: 6 }}>Network: {WALLETS[coin].network}</div>
              <button className="copy-btn" onClick={() => copy(WALLETS[coin].address)}>{copied ? "✓ Copied!" : "📋 Copy Address"}</button>
            </div>
            <p style={{ color: "#8B93A7", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
              After sending, share your transaction hash with your account manager via the community group. Your balance will be updated once confirmed on the blockchain.
            </p>
            <button className="btn btn-gold btn-full" onClick={() => setModal(null)}>Done</button>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {modal === "withdraw" && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>📤 Withdraw Funds</h2>
            <p style={{ color: "#8B93A7", fontSize: 13, marginBottom: 20 }}>Available balance: <span style={{ color: "#00C896", fontWeight: 700 }}>{fmt(cu?.balance || 0)}</span></p>
            <div className="form-group">
              <label className="form-label">Amount (USD)</label>
              <input className="form-input" type="number" placeholder="Enter amount" onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Cryptocurrency</label>
              <select className="form-input" onChange={e => setForm(f => ({ ...f, coin: e.target.value }))}>
                <option value="USDT">USDT (ERC-20)</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Your Wallet Address</label>
              <input className="form-input" type="text" placeholder="Paste your wallet address" onChange={e => setForm(f => ({ ...f, wallet: e.target.value }))} />
            </div>
            {err && <p className="form-error">{err}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost btn-full" onClick={() => { setModal(null); setErr(""); }}>Cancel</button>
              <button className="btn btn-gold btn-full" onClick={withdraw}>Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HOME ─────────────────────────────────────── */}
      {view === "home" && (
        <>
          {/* Ticker */}
          <div className="ticker">
            <div className="ticker-track">
              {[...tickers, ...tickers].map((t, i) => (
                <div key={i} className="ticker-item">● {t.split(" ")[0]} <span>{t.split(" ").slice(1).join(" ")}</span></div>
              ))}
            </div>
          </div>

          {/* Nav */}
          <nav className="nav">
            <div className="logo" onClick={() => go("home")}>Genesis<em>Pro</em>Ltd</div>
            <div className="nav-links">
              <button className="nav-link" onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}>Packages</button>
              <button className="nav-link" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Markets</button>
              <button className="nav-link" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>About</button>
              <button className="nav-link" onClick={() => document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" })}>Testimonials</button>
            </div>
            <div className="nav-actions">
              <button className="btn btn-outline btn-sm" onClick={() => go("login")}>Sign In</button>
              <button className="btn btn-gold btn-sm" onClick={() => go("register")}>Get Started</button>
            </div>
          </nav>

          {/* Hero */}
          <div className="hero">
            <p className="hero-tag">🌍 Trusted Worldwide Investment Platform</p>
            <h1>Grow Your Wealth<br />with <span>Expert Trading</span></h1>
            <p className="hero-sub">GenesisProLtd specializes in cryptocurrency, forex, gold, stocks, and agricultural investments — professionally managed for consistent weekly returns.</p>
            <div className="hero-cta">
              <button className="btn btn-gold" style={{ padding: "14px 32px", fontSize: 15 }} onClick={() => go("register")}>Start Investing Today</button>
              <button className="btn btn-outline" style={{ padding: "14px 32px", fontSize: 15 }} onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}>View Packages</button>
            </div>
            <div className="hero-stats">
              {[["$50M+", "Assets Managed"], ["5,400+", "Global Investors"], ["10+ Yrs", "Trading Experience"], ["25%", "Max Weekly ROI"]].map(([n, l]) => (
                <div key={l} className="hero-stat"><div className="hero-stat-num">{n}</div><div className="hero-stat-label">{l}</div></div>
              ))}
            </div>
          </div>

          {/* Packages */}
          <div id="packages" className="section-dark">
            <div className="section">
              <p className="section-tag">Investment Plans</p>
              <h2 className="section-title">Choose Your Package</h2>
              <p className="section-sub">All packages earn weekly returns from live trading in forex, crypto, gold, and more. Updated every weekend.</p>
              <div className="pkg-grid">
                {PACKAGES.map(pkg => (
                  <div key={pkg.id} className={`pkg-card ${pkg.popular ? "popular" : ""}`}>
                    {pkg.popular && <div className="pkg-badge">Most Popular</div>}
                    <div className="pkg-icon">{pkg.icon}</div>
                    <div className="pkg-name" style={{ color: pkg.color }}>{pkg.name}</div>
                    <div className="pkg-min">Minimum deposit: {fmt(pkg.min)}</div>
                    <div className="pkg-return">{pkg.weekly}</div>
                    <div className="pkg-freq">Weekly return on investment</div>
                    <hr className="pkg-divider" />
                    <div className="pkg-feature">Weekly profit distributions</div>
                    <div className="pkg-feature">Live trading Mon – Fri</div>
                    <div className="pkg-feature">Installment payment option</div>
                    <div className="pkg-feature">Dedicated community group</div>
                    <div className="pkg-feature">Weekly portfolio updates</div>
                    <button className="btn btn-gold btn-full" style={{ marginTop: 24 }} onClick={() => { go("register"); setForm({ package: pkg.id }); }}>
                      Choose {pkg.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features */}
          <div id="features">
            <div className="section">
              <p className="section-tag">Our Markets</p>
              <h2 className="section-title">What We Trade For You</h2>
              <p className="section-sub">Diversified across five major asset classes to maximize your returns and minimize risk.</p>
              <div className="feat-tabs">
                {FEATURES.map(f => (
                  <button key={f.id} className={`feat-tab ${featTab === f.id ? "active" : ""}`} onClick={() => setFeatTab(f.id)}>
                    {f.icon} {f.title}
                  </button>
                ))}
              </div>
              {feat && (
                <div className="feat-content">
                  <div>
                    <p className="feat-desc">{feat.desc}</p>
                    <ul className="feat-points">
                      {feat.points.map((pt, i) => (
                        <li key={i} className="feat-point">
                          <div className="feat-point-icon" style={{ background: feat.color + "22", color: feat.color }}>✓</div>
                          <span style={{ fontSize: 14, color: "#C8CADC" }}>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="feat-visual">
                    <div className="feat-big-icon">{feat.icon}</div>
                    <div className="feat-visual-title" style={{ color: feat.color }}>{feat.title}</div>
                    <div className="feat-visual-sub" style={{ marginTop: 8 }}>{feat.id === "forex" ? "Mon – Fri · Live Markets" : feat.id === "agro" ? "In-House Managed" : feat.id === "crypto" ? "24/7 Markets" : "Global Markets"}</div>
                    <div style={{ marginTop: 24, padding: "14px", background: "#060C1A", borderRadius: 10, border: `1px solid ${feat.color}33` }}>
                      <div style={{ color: feat.color, fontWeight: 800, fontSize: 28 }}>{PACKAGES[1]?.weekly}</div>
                      <div style={{ color: "#8B93A7", fontSize: 12, marginTop: 4 }}>Average weekly returns</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          <div id="about" className="section-dark">
            <div className="section">
              <div className="about-grid">
                <div>
                  <p className="section-tag">About Us</p>
                  <h2 className="section-title">Who We Are</h2>
                  <p style={{ color: "#8B93A7", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
                    GenesisProLtd is a stable and fast-growing investment company specializing in foreign and local cryptocurrencies, digital assets, stocks, and gold trading. Founded by seasoned professionals with over a decade of active market experience, we manage diversified portfolios across forex, crypto, commodities, and agricultural investments for thousands of clients worldwide.
                  </p>
                  <p style={{ color: "#8B93A7", fontSize: 15, lineHeight: 1.8 }}>
                    Headquartered at <span style={{ color: "#C9A84C" }}>260 Jefferson Avenue, Brooklyn, NY 11216</span>, we serve investors across North America, Europe, and beyond — delivering transparent, consistent, professionally managed returns every week.
                  </p>
                  <div className="about-values">
                    {[
                      { icon: "🔍", title: "Transparency", desc: "Full visibility on your portfolio, profits, and every transaction." },
                      { icon: "🛡️", title: "Security", desc: "Crypto-only deposits with admin-verified withdrawal processing." },
                      { icon: "📈", title: "Performance", desc: "10+ years of consistent returns across multiple asset classes." },
                      { icon: "🤝", title: "Community", desc: "Dedicated investor group with weekly trade updates and reports." },
                    ].map(v => (
                      <div key={v.title} className="about-value">
                        <div className="about-value-icon">{v.icon}</div>
                        <div className="about-value-title">{v.title}</div>
                        <div className="about-value-desc">{v.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="vision-box">
                    <div className="vision-label">🌍 Our Vision</div>
                    <p className="vision-text">To become the most trusted and accessible investment platform in the world, empowering individuals everywhere to build generational wealth through diversified trading and real-world assets.</p>
                  </div>
                  <div className="mission-box">
                    <div className="vision-label">🎯 Our Mission</div>
                    <p style={{ fontSize: 15, color: "#C8CADC", lineHeight: 1.75 }}>We provide transparent, professionally-managed investment solutions in cryptocurrency, forex, stocks, gold, and agriculture — enabling our clients to grow their wealth consistently while we handle the trading expertise and market execution.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div id="testimonials">
            <div className="section">
              <p className="section-tag">Client Success Stories</p>
              <h2 className="section-title">What Our Investors Say</h2>
              <p className="section-sub">Thousands of investors across North America and Europe trust GenesisProLtd with their wealth.</p>
              <div className="testi-grid">
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="testi-card">
                    <div className="testi-stars">{"★".repeat(t.stars)}</div>
                    <p className="testi-text">"{t.text}"</p>
                    <div className="testi-author">
                      <div className="testi-avatar">{t.avatar}</div>
                      <div>
                        <div className="testi-name">{t.name}</div>
                        <div className="testi-meta">{t.location} · {t.pkg} Package</div>
                      </div>
                      <div className="testi-badge">+{t.return_}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Banner */}
          <div style={{ background: "linear-gradient(135deg, #131F38, #0D1526)", borderTop: "1px solid #1E2A40", borderBottom: "1px solid #1E2A40" }}>
            <div style={{ maxWidth: 700, margin: "0 auto", padding: "64px 40px", textAlign: "center" }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.5px" }}>Ready to Grow Your <span className="gold">Wealth?</span></h2>
              <p style={{ color: "#8B93A7", fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>Join thousands of investors earning consistent weekly returns. Get started in minutes with our secure, transparent platform.</p>
              <button className="btn btn-gold" style={{ padding: "15px 40px", fontSize: 16 }} onClick={() => go("register")}>Create Your Account</button>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div className="footer-grid">
              <div>
                <div className="logo" style={{ marginBottom: 14, fontSize: 18 }}>Genesis<em>Pro</em>Ltd</div>
                <p style={{ color: "#8B93A7", fontSize: 13, lineHeight: 1.8, maxWidth: 260 }}>A global investment platform specializing in forex, crypto, gold, stocks, and agricultural investments.</p>
                <p style={{ color: "#8B93A7", fontSize: 13, marginTop: 16 }}>📍 260 Jefferson Avenue<br />Brooklyn, NY 11216</p>
              </div>
              <div>
                <div className="footer-col-title">Platform</div>
                <span className="footer-link" onClick={() => go("register")}>Get Started</span>
                <span className="footer-link" onClick={() => go("login")}>Sign In</span>
                <span className="footer-link" onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })}>Packages</span>
                <span className="footer-link" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Markets</span>
              </div>
              <div>
                <div className="footer-col-title">Company</div>
                <span className="footer-link" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>About Us</span>
                <span className="footer-link" onClick={() => document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" })}>Testimonials</span>
              </div>
              <div>
                <div className="footer-col-title">Assets</div>
                {["Cryptocurrency", "Forex Trading", "Gold & Commodities", "Stocks & Equities", "Agricultural"].map(a => (
                  <span key={a} className="footer-link">{a}</span>
                ))}
              </div>
            </div>
            <div className="footer-bottom">
              <span>© 2024 GenesisProLtd. All rights reserved.</span>
              <span>260 Jefferson Avenue, Brooklyn, NY 11216</span>
            </div>
          </div>
        </>
      )}

      {/* ── AUTH ─────────────────────────────────────── */}
      {(view === "login" || view === "register") && (
        <div className="auth-wrap">
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div className="logo" style={{ textAlign: "center", marginBottom: 28, fontSize: 22, cursor: "pointer" }} onClick={() => go("home")}>Genesis<em>Pro</em>Ltd</div>
            <div className="auth-box">
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>{view === "login" ? "Welcome Back" : "Create Your Account"}</h2>
              {view === "register" && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" type="text" placeholder="Your full name" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="••••••••" value={form.password || ""} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              {view === "register" && (
                <div className="form-group">
                  <label className="form-label">Investment Package</label>
                  <select aria-label="investment package" className="form-input" value={form.package || ""} onChange={e => setForm(f => ({ ...f, package: e.target.value }))}>
                    <option value="">Select a package</option>
                    {PACKAGES.map(p => <option key={p.id} value={p.id}>{p.name} — Min. {fmt(p.min)} · {p.weekly} weekly</option>)}
                  </select>
                </div>
              )}
              {err && <p className="form-error">{err}</p>}
              <button className="btn btn-gold btn-full" style={{ marginBottom: 14 }} onClick={view === "login" ? login : register}>
                {view === "login" ? "Sign In" : "Create Account"}
              </button>
              <p style={{ textAlign: "center", color: "#8B93A7", fontSize: 14 }}>
                {view === "login" ? "No account? " : "Already registered? "}
                <span className="gold" style={{ cursor: "pointer" }} onClick={() => go(view === "login" ? "register" : "login")}>
                  {view === "login" ? "Sign up" : "Sign in"}
                </span>
              </p>
              <p className="muted" style={{ textAlign: "center", fontSize: 13, marginTop: 14, cursor: "pointer" }} onClick={() => go("home")}>← Back to home</p>
            </div>
          </div>
        </div>
      )}

      {/* ── DASHBOARD ────────────────────────────────── */}
      {view === "dashboard" && cu && (
        <div className="dash">
          <div className="dash-nav">
            <div className="logo" style={{ fontSize: 17, cursor: "pointer" }} onClick={() => go("home")}>Genesis<em>Pro</em>Ltd</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span className="muted" style={{ fontSize: 14 }}>👤 {cu.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setUser(null); go("home"); }}>Sign Out</button>
            </div>
          </div>
          <div className="dash-body">
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Welcome back, {cu.name.split(" ")[0]} 👋</h1>
              <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                {PACKAGES.find(p => p.id === cu.package)?.name} Package · Joined {fmtD(cu.joined)}
              </p>
            </div>
            <div className="stat-grid">
              <div className="stat-card"><div className="stat-label">Total Balance</div><div className="stat-val green">{fmt(cu.balance)}</div><div className="stat-sub">Available to withdraw</div></div>
              <div className="stat-card"><div className="stat-label">Total Deposited</div><div className="stat-val">{fmt(cu.totalDeposit)}</div></div>
              <div className="stat-card"><div className="stat-label">Total Profit</div><div className="stat-val gold">{fmt(cu.totalProfit)}</div></div>
              <div className="stat-card"><div className="stat-label">Total Withdrawn</div><div className="stat-val">{fmt(cu.totalWithdrawn)}</div></div>
              <div className="stat-card" style={{ gridColumn: "span 2" }}>
                <div className="stat-label">Return on Investment (ROI)</div>
                <div className="stat-val gold">{cu.roi}%</div>
                <div className="roi-bar"><div className="roi-fill" style={{ width: `${Math.min(+cu.roi, 100)}%` }} /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
              <button className="btn btn-gold" onClick={() => { setModal("deposit"); setCopied(false); setInstallments(1); }}>+ Make Deposit</button>
              <button className="btn btn-green" onClick={() => { setModal("withdraw"); setForm({}); setErr(""); }}>Withdraw Funds</button>
            </div>
            <div className="tabs">
              {["overview", "transactions", "withdrawals"].map(t => (
                <button key={t} className={`tab ${dashTab === t ? "active" : ""}`} onClick={() => setDashTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {dashTab === "overview" && (
              <div className="card">
                <h3 style={{ marginBottom: 20 }}>Your Investment Package</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
                  {[
                    ["Package", PACKAGES.find(p => p.id === cu.package)?.name, "#C9A84C"],
                    ["Weekly Return", PACKAGES.find(p => p.id === cu.package)?.weekly, "#00C896"],
                    ["Trading Days", "Mon – Fri", "#E8EAF0"],
                    ["Update Schedule", "Every Weekend", "#E8EAF0"],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ background: "#060C1A", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ color: "#8B93A7", fontSize: 12, marginBottom: 6 }}>{l}</div>
                      <div style={{ fontWeight: 800, color: c, fontSize: 17 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dashTab === "transactions" && (
              <div className="card" style={{ overflowX: "auto" }}>
                <h3 style={{ marginBottom: 20 }}>Transaction History</h3>
                {cu.transactions.length === 0
                  ? <div className="empty"><div className="empty-icon">📋</div><p>No transactions yet.</p></div>
                  : <table className="tx-table">
                    <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th><th>Note</th></tr></thead>
                    <tbody>
                      {[...cu.transactions].reverse().map(tx => (
                        <tr key={tx.id}>
                          <td className="muted">{fmtD(tx.date)}</td>
                          <td><span className={`badge b-${tx.type}`}>{tx.type}</span></td>
                          <td style={{ fontWeight: 700, color: tx.type === "withdrawal" ? "#FF6666" : "#00C896" }}>{tx.type === "withdrawal" ? "-" : "+"}{fmt(tx.amount)}</td>
                          <td><span className={`badge b-${tx.status}`}>{tx.status}</span></td>
                          <td className="muted" style={{ fontSize: 13 }}>{tx.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>}
              </div>
            )}
            {dashTab === "withdrawals" && (
              <div className="card">
                <h3 style={{ marginBottom: 20 }}>Withdrawal Requests</h3>
                {cu.withdrawalRequests.length === 0
                  ? <div className="empty"><div className="empty-icon">📤</div><p>No withdrawal requests yet.</p></div>
                  : cu.withdrawalRequests.map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #1E2A4022", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{fmt(r.amount)} <span className="muted" style={{ fontWeight: 400 }}>via {r.coin}</span></div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{r.wallet.slice(0, 20)}... · {fmtD(r.date)}</div>
                      </div>
                      <span className={`badge ${r.status === "approved" ? "b-confirmed" : "b-pending"}`}>{r.status}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN ────────────────────────────────────── */}
      {view === "admin" && (
        <div className="admin-layout">
          <div className="sidebar">
            <div className="logo" style={{ fontSize: 15, marginBottom: 28, cursor: "pointer" }} onClick={() => go("home")}>Genesis<em>Pro</em> Admin</div>
            {[
              { id: "clients", icon: "👥", label: "Clients" },
              { id: "withdrawals", icon: "📤", label: "Withdrawals" },
              { id: "overview", icon: "📊", label: "Overview" },
            ].map(m => (
              <button key={m.id} className={`sidebar-item ${adminTab === m.id ? "active" : ""}`} onClick={() => setAdminTab(m.id)}>
                {m.icon} {m.label}
              </button>
            ))}
            <div style={{ marginTop: 32 }}>
              <button className="btn btn-ghost btn-sm btn-full" onClick={() => go("home")}>← Back to Site</button>
            </div>
          </div>
          <div className="admin-body">
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
              {adminTab === "clients" ? "Client Management" : adminTab === "withdrawals" ? "Withdrawal Requests" : "Platform Overview"}
            </h1>
            <p className="muted" style={{ fontSize: 14, marginBottom: 28 }}>
              {adminTab === "clients" ? `${clients.length} registered investors` : adminTab === "withdrawals" ? "Review and approve pending requests" : "Platform-wide statistics"}
            </p>

            {adminTab === "overview" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                {[
                  ["👥", "Total Clients", clients.length],
                  ["💰", "Total Deposits", fmt(clients.reduce((s, c) => s + c.totalDeposit, 0))],
                  ["📈", "Total Profits Paid", fmt(clients.reduce((s, c) => s + c.totalProfit, 0))],
                  ["📤", "Total Withdrawn", fmt(clients.reduce((s, c) => s + c.totalWithdrawn, 0))],
                  ["🏦", "Total Balances", fmt(clients.reduce((s, c) => s + c.balance, 0))],
                  ["⏳", "Pending Withdrawals", clients.reduce((s, c) => s + c.withdrawalRequests.filter(r => r.status === "pending").length, 0)],
                ].map(([icon, label, val]) => (
                  <div key={label} className="stat-card">
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                    <div className="stat-label">{label}</div>
                    <div className="stat-val" style={{ fontSize: 20 }}>{val}</div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === "clients" && clients.map(c => <AdminCard key={c.id} client={c} onUpdate={adminUpdate} />)}

            {adminTab === "withdrawals" && (() => {
              const all = clients.flatMap(c => c.withdrawalRequests.map(r => ({ ...r, cname: c.name, cid: c.id })));
              return all.length === 0
                ? <div className="empty"><div className="empty-icon">📤</div><p>No withdrawal requests.</p></div>
                : all.map(r => (
                  <div key={r.id} style={{ background: "#0D1526", border: "1px solid #1E2A40", borderRadius: 12, padding: "18px 22px", marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{r.cname} — <span className="gold">{fmt(r.amount)}</span> <span className="muted">via {r.coin}</span></div>
                        <div className="wallet-box" style={{ fontSize: 12, marginTop: 8 }}>{r.wallet}</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{fmtD(r.date)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span className={`badge ${r.status === "approved" ? "b-confirmed" : "b-pending"}`}>{r.status}</span>
                        {r.status === "pending" && <button className="btn btn-green btn-sm" onClick={() => approveWithdrawal(r.cid, r.id)}>Approve</button>}
                      </div>
                    </div>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}
    </>
  );
}

interface AdminCardProps {
  client: Client;
  onUpdate: (
    clientId: string,
    amount: number,
    type: "deduct" | "profit" | "deposit"
  ) => void;
}

function AdminCard({ client, onUpdate }: AdminCardProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"profit" | "deposit" | "deduct">("profit");
  const [amount, setAmount] = useState("");
  const pkg = PACKAGES.find(p => p.id === client.package);
  const fmt2 = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <div className="client-card">
      <div className="client-head" onClick={() => setOpen(o => !o)}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: 3 }}>{client.name}</div>
          <div style={{ color: "#8B93A7", fontSize: 13 }}>{client.email} · <span style={{ color: pkg?.color }}>{pkg?.name}</span></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#00C896", fontWeight: 800 }}>{fmt2(client.balance)}</div>
            <div style={{ color: "#8B93A7", fontSize: 11 }}>Balance</div>
          </div>
          <span style={{ color: "#8B93A7" }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className="client-body" style={{ paddingTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 18 }}>
            {[["Deposited", fmt2(client.totalDeposit)], ["Profit", fmt2(client.totalProfit)], ["Withdrawn", fmt2(client.totalWithdrawn)], ["ROI", `${client.roi}%`]].map(([l, v]) => (
              <div key={l} style={{ background: "#060C1A", borderRadius: 8, padding: "11px 14px" }}>
                <div style={{ color: "#8B93A7", fontSize: 11, marginBottom: 4 }}>{l}</div>
                <div style={{ fontWeight: 800, color: "#C9A84C" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", color: "#8B93A7", fontSize: 11, marginBottom: 5, fontWeight: 700 }}>UPDATE TYPE</label>
              <select aria-label="update type" style={{ background: "#060C1A", border: "1px solid #1E2A40", borderRadius: 6, color: "#E8EAF0", padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none" }} value={type} onChange={e => setType(e.target.value as "profit" | "deposit" | "deduct")}>
                <option value="profit">Add Profit</option>
                <option value="deposit">Add Deposit</option>
                <option value="deduct">Deduct Balance</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "#8B93A7", fontSize: 11, marginBottom: 5, fontWeight: 700 }}>AMOUNT (USD)</label>
              <input style={{ background: "#060C1A", border: "1px solid #1E2A40", borderRadius: 6, color: "#E8EAF0", padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", width: 150 }} type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <button aria-label="update balance" className="btn btn-gold btn-sm" onClick={() => { onUpdate(client.id, Number(amount), type as "profit" | "deduct" | "deposit"); setAmount(""); }}>Update Balance</button>
          </div>
          {client.transactions.length > 0 && (
            <div>
              <div style={{ color: "#8B93A7", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>Recent Transactions</div>
              {[...client.transactions].reverse().slice(0, 5).map(tx => (
                <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1E2A4022", fontSize: 13 }}>
                  <span style={{ color: "#8B93A7" }}>{tx.date} · {tx.type}</span>
                  <span style={{ color: tx.type === "withdrawal" ? "#FF6666" : "#00C896", fontWeight: 700 }}>{tx.type === "withdrawal" ? "-" : "+"}{fmt2(tx.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}