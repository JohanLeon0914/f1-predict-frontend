import type { FightingStyleId } from "../types";

export type CareerRosterFighter = {
  imageUrl?: string;
  name: string;
  nickname?: string;
  ranking: number;
  record: string;
  style: FightingStyleId;
  weightClass: string;
};

export const careerRoster: CareerRosterFighter[] = [
  { name: "Brandon Moreno", nickname: "The Assassin Baby", ranking: 1, record: "24-8-2", style: "balanced", weightClass: "Flyweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/5k6ozu1706006024.png" },
  { name: "Brandon Royval", ranking: 2, record: "17-7", style: "bjj", weightClass: "Flyweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/0k5sik1712737576.png" },
  { name: "Sean O'Malley", nickname: "Suga", ranking: 1, record: "18-2", style: "striker", weightClass: "Bantamweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/cki55v1692640323.png" },
  { name: "Merab Dvalishvili", nickname: "The Machine", ranking: 2, record: "18-4", style: "wrestler", weightClass: "Bantamweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/ecb6yk1726476068.png" },
  { name: "Ilia Topuria", ranking: 1, record: "16-0", style: "striker", weightClass: "Featherweight" },
  { name: "Alexander Volkanovski", nickname: "The Great", ranking: 2, record: "26-4", style: "balanced", weightClass: "Featherweight" },
  { name: "Dan Hooker", nickname: "The Hangman", ranking: 5, record: "24-12", style: "kickboxer", weightClass: "Lightweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/djm2rt1732795324.png" },
  { name: "Benoit Saint Denis", nickname: "God of War", ranking: 7, record: "13-2", style: "bjj", weightClass: "Lightweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/1cqvea1733497490.png" },
  { name: "Rafael Fiziev", nickname: "Ataman", ranking: 9, record: "12-4", style: "kickboxer", weightClass: "Lightweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/st8keb1594817964.png" },
  { name: "Islam Makhachev", ranking: 1, record: "26-1", style: "wrestler", weightClass: "Welterweight" },
  { name: "Kamaru Usman", nickname: "The Nigerian Nightmare", ranking: 4, record: "20-4", style: "wrestler", weightClass: "Welterweight" },
  { name: "Nassourdine Imavov", ranking: 4, record: "16-4", style: "striker", weightClass: "Middleweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/ho3t9t1707037656.png" },
  { name: "Brendan Allen", nickname: "All In", ranking: 8, record: "24-6", style: "bjj", weightClass: "Middleweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/3o9gm81712753579.png" },
  { name: "Alex Pereira", nickname: "Poatan", ranking: 1, record: "12-3", style: "kickboxer", weightClass: "Light Heavyweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/3a9h2j1728206945.png" },
  { name: "Magomed Ankalaev", ranking: 2, record: "20-1-1", style: "balanced", weightClass: "Light Heavyweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/hl8yyw1675769669.png" },
  { name: "Ciryl Gane", nickname: "Bon Gamin", ranking: 2, record: "13-2", style: "kickboxer", weightClass: "Heavyweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/t1q1211680086818.png" },
  { name: "Alexander Volkov", nickname: "Drago", ranking: 5, record: "38-11", style: "striker", weightClass: "Heavyweight", imageUrl: "https://r2.thesportsdb.com/images/media/player/cutout/wb8icp1620591417.png" },
];
