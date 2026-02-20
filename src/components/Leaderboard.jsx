import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const dummyLeaderboard = [
  { userOne: 'cipher_fox', userTwo: 'byte_wisp', score: 54 },
  { userOne: 'hex_hawk', userTwo: 'grid_ghost', score: 49 },
  { userOne: 'neon_nova', userTwo: 'loop_lion', score: 44 },
  { userOne: 'delta_drift', userTwo: 'omega_orbit', score: 40 },
  { userOne: 'pixel_pulse', userTwo: 'quant_quill', score: 37 },
  { userOne: 'syntax_sage', userTwo: 'token_tide', score: 31 },
  { userOne: 'vector_vault', userTwo: 'logic_luma', score: 28 },
  { userOne: 'lambda_lane', userTwo: 'matrix_mint', score: 25 },
  { userOne: 'cryptic_cove', userTwo: 'rune_rider', score: 22 }
];

const rankBadgeClass = (rank) => {
  if (rank === 1) return 'badge badge-warning badge-sm';
  if (rank === 2) return 'badge badge-neutral badge-sm';
  if (rank === 3) return 'badge badge-accent badge-sm';
  return 'badge badge-ghost badge-sm';
};

export default function Leaderboard() {
  const [topActualRecord, setTopActualRecord] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase.rpc('get_leaderboard', { limit_count: 10 });
      if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
      }

      setTopActualRecord(Array.isArray(data) && data.length > 0 ? data[0] : null);
    };

    fetchLeaderboard();
  }, []);

  const actualRow = useMemo(() => {
    if (!topActualRecord) return null;

    const userOne =
      topActualRecord.user_one_username ??
      '--';
    const userTwo =
      topActualRecord.user_two_username ??
      '--';
    const score = Number(topActualRecord.high_score ?? 0);

    return {
      userOne,
      userTwo,
      score: Number.isFinite(score) ? score : 0
    };
  }, [topActualRecord]);

  return (
    <div className="card bg-base-100 shadow-2xl border border-base-300">
      <div className="card-body p-0">
        <div className="bg-linear-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white px-5 py-4 rounded-t-2xl">
          <h3 className="font-bold text-lg">Top Pair Leaderboard</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th className="w-24">Position</th>
                <th>Pair</th>
                <th className="text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {dummyLeaderboard.map((row, index) => {
                const rank = index + 1;
                return (
                  <tr key={`${row.userOne}-${row.userTwo}`}>
                    <td>
                      <span className={rankBadgeClass(rank)}>#{rank}</span>
                    </td>
                    <td>
                      <span className="font-medium">{row.userOne}</span>
                      <span className="text-base-content/60"> / </span>
                      <span className="font-medium">{row.userTwo}</span>
                    </td>
                    <td className="text-right font-bold">{row.score}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={3} className="py-0">
                  <div className="divider my-0"></div>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="badge badge-outline badge-sm">--</span>
                </td>
                <td>
                  <span className="font-medium">{actualRow?.userOne ?? 'loading_user_1'}</span>
                  <span className="text-base-content/60"> / </span>
                  <span className="font-medium">{actualRow?.userTwo ?? 'loading_user_2'}</span>
                </td>
                <td className="text-right font-bold">{actualRow?.score ?? '--'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
