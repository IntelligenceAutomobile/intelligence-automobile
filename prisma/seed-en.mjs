/**
 * Populates descriptionEn + featuresEn for all vehicles.
 * Run with: node prisma/seed-en.mjs
 */
import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://intelligence-automobile-intelligenceautomobile.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzk5NjQ1NjAsImlkIjoiMDE5ZTZlMjctM2UwMS03NTQxLThlMWQtZmU0MzMzNzA3MmIwIiwicmlkIjoiMWY5MWEzNzctNTI0Yy00YTI1LTlkYzEtZmYwMjM0YTIzNjM0In0.W1qf2kXXDts5K7RHUq0UsUjVoCdSUtEKvgwbEzcWDozzDjnn3KmWlOIEnrLRHxWulZSK6tbG3QTPCdKhM_t2BA',
});

const translations = [
  {
    id: 'audi-tt-mk3-sline-2014',
    descriptionEn: `Third generation of the Audi TT Coupé — 8S generation, produced from 2014 to 2023. This 2.0 TFSI 230 hp paired with quattro all-wheel drive and the 7-speed S tronic gearbox represents the most accomplished configuration in the range. The Virtual Cockpit (12.3" fully digital instrument cluster) made its debut on this generation.

First registered on 17/11/2014 in Belgium. Mileage at Belgian MOT (24/04/2026): 147,005 km. S line trim with aluminium door sills, 19" multi-spoke alloy wheels and Alcantara/leather upholstery. Belgian MOT valid until 24/04/2027. Belgian Car-Pass available.

MOT valid until 24/04/2027. No accident on record. Belgian Car-Pass with full mileage history.`,
    featuresEn: JSON.stringify([
      'Virtual Cockpit — 12.3" fully digital instrument cluster',
      'Apple CarPlay integrated',
      'Full S line exterior pack',
      'S line aluminium door sills',
      '19" multi-spoke alloy wheels',
      'Alcantara/leather upholstery',
      '7-speed S tronic gearbox',
      'quattro all-wheel drive (Haldex)',
      'Haldex system serviced (Feb. 2026)',
      'New spark plugs (Feb. 2026)',
      'New VARTA AGM battery (Mar. 2025)',
      'Automatic climate control',
      'LED headlights',
      'Cruise control',
      'Folding electric door mirrors',
      'Rear parking sensors',
      'ESP + ASR',
      'Driver / passenger / side airbags',
      'Euro 6 standard',
    ]),
  },
  {
    id: 'audi-tt-mk2-sline-2010',
    descriptionEn: `2+2 sports coupé from the second generation of the TT series, discontinued in November 2023 with no announced successor. The 2.0 TFSI EA888 engine delivers 200 hp and 280 Nm of torque, paired with a 6-speed manual gearbox.

First registered on 25 May 2010. Full service history, MOT passed, comprehensive maintenance record. The S-line trim includes 19-inch alloy wheels, heated leather seats and a leather sports steering wheel.

Brakes fully renewed: new front and rear discs and pads, recent front tyres. No accident on record.`,
    featuresEn: JSON.stringify([
      'New front brake discs',
      'New front brake pads',
      'New rear brake discs',
      'New rear brake pads',
      'Recent front tyres',
      'S-line rear spoiler',
      '19-inch lightweight alloy wheels',
      'Electric folding door mirrors',
      'Original parcel shelf',
      'Automatic climate control',
      'External temperature display',
      'Leather gear lever',
      'Electric front/rear windows',
      'On-board computer',
      'Driver information system',
      'Heated rear window',
      'Leather sports steering wheel',
      'Electronic immobiliser',
      'Brake assist',
      'Heated leather seats',
      'Check-control system',
      'Remote central locking',
      'Driver airbag',
      'Driver and passenger side airbags',
      'Passenger airbag',
      'Traction control',
      'Tyre pressure monitoring (RDC)',
      'ESP (Electronic Stability Programme)',
      'Front fog lights',
      'ABS (Anti-lock Braking System)',
      'Manually adjustable steering column',
      'Cargo tie-down hooks',
    ]),
  },
  {
    id: 'cmpqmqrnk0000f4vvwbr2z3dq',
    descriptionEn: `Audi A3 Sportback e-tron imported from Belgium — excellent overall condition, S line trim, plug-in hybrid drivetrain.

e-tron powertrain: 1.4 TFSI paired with an electric motor — 204 hp system output, 6-speed S tronic gearbox. Full electric range: 50 km. Fuel consumption in hybrid mode: 4.8 L/100 km on the combined cycle.

No accident on record. MOT valid until 11/2025. Full service history. 2 previous owners.

All administrative procedures fully handled: French registration, financing, insurance. Test drive available by appointment.`,
    featuresEn: JSON.stringify([
      'Plug-in hybrid (PHEV)',
      '100% electric mode (~50 km range)',
      'On-board charger + charging cable included',
      '6-speed S tronic gearbox',
      'Euro 6d standard — 4.8 L/100 km (combined)',
      'S line exterior pack',
      '18" anthracite S line alloy wheels',
      'S line front/rear bumpers',
      'S line side skirts',
      'LED rear lights',
      'S line sport seats partial leather black',
      'S line multifunction leather sports steering wheel',
      'Audi dual-zone climate control',
      'MMI navigation',
      'Bluetooth & smartphone connectivity',
      'Adaptive cruise control',
      'Heated electric door mirrors',
      'Keyless entry & start',
      'Rear parking sensors',
      'Rear-view camera',
      '6 airbags',
      'ESP & ASR',
      'Isofix',
    ]),
  },
  {
    id: 'cmppu3mt30000y8vvqdrmj12s',
    descriptionEn: `Outstanding Audi A3 Sportback e-tron 1.4 PHEV 204 hp S line imported from Belgium, in excellent condition. Finished in Metallic Grey, it combines the elegance of the S line trim with the modernity of a plug-in hybrid drivetrain — a rare and compelling pairing.

The e-tron powertrain combines a 1.4 TFSI four-cylinder with an electric motor for a system output of 204 horsepower, delivered via the S tronic gearbox. In full electric mode, it offers up to 50 km of zero-emission range — ideal for daily driving. In hybrid mode, fuel consumption drops to 4.8 L/100 km on the combined cycle.

The S line trim delivers a boldly sporting stance from first glance: specific bumpers, 18" anthracite alloy wheels, side skirts and sport partial leather black interior with contrast stitching.

No accident on record, excellent mechanical and cosmetic condition, clean and well-kept interior. MOT valid (11/2025). Full service history, 2 previous owners.

Intelligence Automobile handles all administrative procedures in full: French registration, inspection, financing and insurance. Test drive available by appointment.`,
    featuresEn: JSON.stringify([
      'Plug-in hybrid (PHEV)',
      '100% electric mode (~50 km range)',
      'On-board charger + charging cable included',
      '6-speed S tronic gearbox',
      'Euro 6d standard — 4.8 L/100 km (combined)',
      'S line exterior pack',
      '18" anthracite S line alloy wheels',
      'S line front/rear bumpers',
      'S line side skirts',
      'LED rear lights',
      'S line sport seats partial leather black',
      'S line multifunction leather sports steering wheel',
      'Audi dual-zone climate control',
      'MMI navigation',
      'Bluetooth & smartphone connectivity',
      'Adaptive cruise control',
      'Heated electric door mirrors',
      'Keyless entry & start',
      'Rear parking sensors',
      'Rear-view camera',
      '6 airbags',
      'ESP & ASR',
      'Isofix',
    ]),
  },
  {
    id: 'cmppfcv2u00002cvvmr6dkxaw',
    descriptionEn: `Audi TT Coupé 2.0 TFSI imported from Germany — excellent condition, S line Competition trim, Daytona Grey Pearl finish. Iconic design, uncompromising stylistic coherence.

2.0 TFSI four-cylinder — 230 hp, 6-speed S tronic gearbox. Sharp performance and everyday driving pleasure. Fully digital Virtual Cockpit, MMI navigation, Alcantara upholstery.

MOT valid. Full service history. No accident on record. 2 previous owners.

Intelligence Automobile handles all administrative procedures in full: French registration, financing, insurance. Test drive available by appointment.`,
    featuresEn: JSON.stringify([
      'S line Competition pack',
      '19" bi-tone anthracite lightweight alloy wheels',
      'Fixed rear spoiler',
      'Sport rear diffuser',
      'Dual chrome exhaust tips',
      'S line specific front/rear bumpers',
      'S line side skirts',
      'Audi LED matrix headlights',
      'LED rear lights',
      'Ambient lighting',
      'Audi Virtual Cockpit',
      'High-resolution MMI navigation',
      'S line sport seats in Alcantara fabric/leather',
      'Dual-zone climate control',
      'Flat-bottom multifunction sports steering wheel',
      'Keyless entry & start',
      'Auto-dimming interior mirror',
      'Bluetooth & smartphone connectivity',
      'Rear parking sensors',
      'Adaptive cruise control',
      'Bang & Olufsen audio system',
      '6 airbags',
      'ESP & ASR',
      'Audi sport brakes',
    ]),
  },
];

for (const v of translations) {
  await db.execute({
    sql: `UPDATE Vehicle SET descriptionEn = ?, featuresEn = ? WHERE id = ?`,
    args: [v.descriptionEn, v.featuresEn, v.id],
  });
  console.log('✓', v.id);
}

console.log('\nDone — all EN translations saved.');
