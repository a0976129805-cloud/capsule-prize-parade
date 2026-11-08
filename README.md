# Capsule Prize Parade

請幫我開發/替換一個適合在手機上（以 LINE LIFF / 手機瀏覽器體驗為核心）操作的「日系線上扭蛋機 Web App」。

以下是我需要的完整單一檔案 React 程式碼（內建管理者後台、線上倉庫與 7-11 賣貨便貨到付款功能），請直接幫我運行這個專案：

```jsx

import React, { useState, useEffect } from 'react';

import { 

  Sparkles, Package, ShoppingBag, ShoppingCart, Settings, 

  RotateCw, RefreshCw, ChevronRight, CheckCircle2, ArrowLeft, 

  Plus, Trash2, Edit3, Image as ImageIcon, ExternalLink, Check, User

} from 'lucide-react';

const DEFAULT_MACHINES = [

  {

    id: 'm1',

    title: '【CAP\'in GALLERY】 miffy Glint Series',

    price: 150,

    totalStock: 50,

    coverImage: '[https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=600](https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=600)',

    status: '熱烈販售中',

    items: [

      { id: 'i1', name: '米飛兔 珍珠白公仔', image: '[https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=300](https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=300)' },

      { id: 'i2', name: '米飛兔 經典黃公仔', image: '[https://images.unsplash.com/photo-1558679908-541bcf1249ff?auto=format&fit=crop&q=80&w=300](https://images.unsplash.com/photo-1558679908-541bcf1249ff?auto=format&fit=crop&q=80&w=300)' },

      { id: 'i3', name: '米飛兔 薄荷綠公仔', image: '[https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&q=80&w=300](https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&q=80&w=300)' },

    ]

  },

  {

    id: 'm2',

    title: '夢之蠟筆王國 飾品配件專用輯',

    price: 100,

    totalStock: 30,

    coverImage: '[https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&q=80&w=600](https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&q=80&w=600)',

    status: '熱烈販售中',

    items: [

      { id: 'i4', name: '魔法杖 吊飾', image: '[https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&q=80&w=300](https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&q=80&w=300)' },

      { id: 'i5', name: '香水瓶 鑰匙圈', image: '[https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=300](https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&q=80&w=300)' },

    ]

  },

  {

    id: 'm3',

    title: 'rom&nd 縮小版甜心彩妝模型 Vol.3',

    price: 100,

    totalStock: 15,

    coverImage: '[https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600](https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600)',

    status: '少量即將完售',

    items: [

      { id: 'i6', name: '迷你唇釉 01 號', image: '[https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=300](https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=300)' },

      { id: 'i7', name: '迷你氣墊粉餅', image: '[https://images.unsplash.com/photo-1558679908-541bcf1249ff?auto=format&fit=crop&q=80&w=300](https://images.unsplash.com/photo-1558679908-541bcf1249ff?auto=format&fit=crop&q=80&w=300)' },

    ]

  }

];

export default function App() {

  const [activeTab, setActiveTab] = useState('home');

  const [machines, setMachines] = useState(DEFAULT_MACHINES);

  const [selectedMachine, setSelectedMachine] = useState(null);

  const [vault, setVault] = useState([]);

  const [selectedVaultIds, setSelectedVaultIds] = useState([]);

  const [orders, setOrders] = useState([]);

  const [isSpinning, setIsSpinning] = useState(false);

  const [spinResult, setSpinResult] = useState([]);

  const [showResultModal, setShowResultModal] = useState(false);

  const [shippingForm, setShippingForm] = useState({

    name: '', phone: '', storeName: '', storeCode: ''

  });

  const handleDraw = (count) => {

    if (!selectedMachine || selectedMachine.totalStock < count) {

      alert('庫存不足！');

      return;

    }

    setIsSpinning(true);

    setTimeout(() => {

      const drawnItems = [];

      for (let i = 0; i < count; i++) {

        const randomItem = selectedMachine.items[Math.floor(Math.random() * selectedMachine.items.length)];

        const newItem = {

          vaultId: Date.now() + Math.random().toString(),

          machineTitle: selectedMachine.title,

          ...randomItem,

          drawnAt: new Date().toLocaleDateString()

        };

        drawnItems.push(newItem);

      }

      setVault(prev => [...prev, ...drawnItems]);

      setMachines(prev => prev.map(m => m.id === selectedMachine.id ? { ...m, totalStock: m.totalStock - count } : m));

      setSelectedMachine(prev => ({ ...prev, totalStock: prev.totalStock - count }));

      setIsSpinning(false);

      setSpinResult(drawnItems);

      setShowResultModal(true);

    }, 1500);

  };

  const handleCheckout = (e) => {

    e.preventDefault();

    if (selectedVaultIds.length === 0) return alert('請先選擇要寄出的商品！');

    const itemsToShip = vault.filter(v => selectedVaultIds.includes(v.vaultId));

    const newOrder = {

      id: 'ORD-' + Date.now().toString().slice(-6),

      user: '徐詠竣 (LINE)',

      items: itemsToShip,

      shipping: { ...shippingForm },

      createdAt: new Date().toLocaleString(),

      status: '待出貨'

    };

    setOrders(prev => [newOrder, ...prev]);

    setVault(prev => prev.filter(v => !selectedVaultIds.includes(v.vaultId)));

    setSelectedVaultIds([]);

    setShippingForm({ name: '', phone: '', storeName: '', storeCode: '' });

    alert('🎉 出貨申請已送出！已自動為您跳轉/產生 7-11 賣貨便貨到付款單據。');

    setActiveTab('admin');

  };

  return (

    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">

      <header className="bg-emerald-600 text-white sticky top-0 z-30 shadow-md">

        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">

          <div className="flex items-center gap-2">

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://capsule-prize-parade.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dbec3963-7069-5a0e-b537-591274acd943).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
