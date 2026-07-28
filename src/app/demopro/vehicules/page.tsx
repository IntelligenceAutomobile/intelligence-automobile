"use client";

// Liste du stock de la démonstration publique /demopro.
//
// Rend le MÊME composant que le back-office, entièrement manipulable : changer
// un statut, publier ou masquer, dupliquer, supprimer, agir sur une sélection.
// Les écritures vont dans le bac à sable du visiteur, jamais en base.
import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/app/admin/toast";
import { AdminPage, PageHeader, firstImage, btnPrimaryClass, btnPrimaryStyle } from "@/app/admin/ui";
import StockList, { type StockItem, type StockWriter } from "@/app/admin/vehicules/StockList";
import { completeness, missingEssentials, daysBetween } from "@/lib/vehicules";
import { computeMargin } from "@/lib/vehicle-tracking";
import { getDemoVehicleCosts, getDemoVehicleNotes, type DemoVehicle } from "@/lib/demo-data";
import { useDemoStore, demoId, addBlankVehicle } from "../store";
import { DEMO_BASE } from "../demo";

const VALID_FILTERS = ["disponible", "reserve", "vendu", "a-completer", "dorment"];

function countJson(raw: string): number {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((v) => v !== null && v !== "").length : 0;
  } catch {
    return 0;
  }
}

function toStockItem(v: DemoVehicle, now: Date): StockItem {
  const image = firstImage(v.images);
  const photoCount = countJson(v.images);
  const health = completeness({
    image,
    price: v.price,
    photoCount,
    hasDescription: v.description.trim().length >= 200,
    featureCount: countJson(v.features),
    documentCount: countJson(v.documents),
  });

  const costs = getDemoVehicleCosts(v.id);
  const total = costs.reduce((sum, c) => sum + c.amountCents, 0);
  const hasPurchase = costs.some((c) => c.category === "achat");

  return {
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    mileage: v.mileage,
    price: v.price,
    fuel: v.fuel,
    origin: v.origin,
    color: v.color,
    power: v.power,
    status: v.status,
    image,
    photoCount,
    isPublished: v.isPublished,
    daysInStock: daysBetween(v.createdAt, now),
    marginCents: hasPurchase ? computeMargin(v.price, total).marginCents : null,
    openProblems: getDemoVehicleNotes(v.id).filter((n) => n.type === "probleme" && !n.resolved).length,
    completeness: health.score,
    blocking: missingEssentials({ image, price: v.price }),
    todo: health.missing,
  };
}

export default function DemoVehiculesList() {
  const params = useSearchParams();
  const toast = useToast();
  const { vehicles, actions } = useDemoStore();

  const statut = params.get("statut");
  const initialFilter = statut && VALID_FILTERS.includes(statut) ? statut : "all";

  const now = new Date();
  const items: StockItem[] = vehicles
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((v) => toStockItem(v, now));

  const available = items.filter((v) => v.status === "disponible");
  const hidden = items.filter((v) => !v.isPublished).length;

  // Carnet d'écriture du bac à sable : même contrat que l'API, sans réseau.
  const writer: StockWriter = {
    update: async (id, delta) => {
      actions.updateVehicle(id, delta as Partial<DemoVehicle>);
    },
    remove: async (id) => {
      actions.removeVehicle(id);
    },
    duplicate: async (id) => {
      const source = vehicles.find((v) => v.id === id);
      if (!source) throw new Error();
      const copy: DemoVehicle = {
        ...source,
        id: demoId("veh"),
        model: `${source.model} (copie)`,
        status: "disponible",
        isPublished: false,
        images: "[]",
        conditionFacts: "[]",
        maintenanceHistory: "[]",
        maintenanceHighlights: "[]",
        documents: "[]",
        createdAt: new Date(),
      };
      actions.addVehicle(copy);
      return { id: copy.id };
    },
  };

  return (
    <AdminPage>
      <PageHeader
        title="Gestion du stock"
        subtitle={
          items.length === 0
            ? "Vos annonces, publiées ou masquées."
            : `${items.length} véhicule${items.length > 1 ? "s" : ""} · ${available.length} disponible${available.length > 1 ? "s" : ""}` +
              (hidden > 0 ? `, ${hidden} masqué${hidden > 1 ? "s" : ""}` : "")
        }
        action={
          <button
            type="button"
            onClick={() => {
              addBlankVehicle();
              toast.success("Annonce créée. Elle apparaît en tête de liste, masquée du site.");
            }}
            className={btnPrimaryClass}
            style={btnPrimaryStyle}
          >
            <Plus size={14} />
            Ajouter
          </button>
        }
      />
      <StockList
        vehicles={items}
        initialFilter={initialFilter}
        initialQuery={params.get("q") ?? ""}
        initialSort={params.get("tri") ?? "recent"}
        canDelete
        writer={writer}
        // Les fiches de la démo restent dans la démo, et ses véhicules n'ont
        // pas d'annonce publique puisque ce sont des exemples.
        base={`${DEMO_BASE}/vehicules`}
        publicBase={null}
      />
    </AdminPage>
  );
}
