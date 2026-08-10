
import { getAdminUserByUsername } from './src/database';
import fetch from 'node-fetch';

async function testTournamentCreation() {
    try {
        const adminUser = await getAdminUserByUsername('admin');
        if (!adminUser) {
            console.error('Admin user not found');
            return;
        }

        const adminId = adminUser.id;

        // 1. Get initial list of tournaments
        let response = await fetch(`http://localhost:3003/api/admin/tournaments?userId=${adminId}`);
        let tournaments = await response.json();
        console.log('Initial tournaments:', tournaments);

        // 2. Create a new tournament
        const newTournament = {
            name: 'Test Tournament',
            entryFee: 10,
            prizePool: 100,
            maxPlayers: 16,
            startDate: new Date().toISOString(),
        };

        response = await fetch(`http://localhost:3003/api/admin/tournaments/create?userId=${adminId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTournament),
        });

        const createdTournament = await response.json();
        console.log('Created tournament:', createdTournament);

        // 3. Get updated list of tournaments
        response = await fetch(`http://localhost:3003/api/admin/tournaments?userId=${adminId}`);
        tournaments = await response.json();
        console.log('Updated tournaments:', tournaments);

    } catch (error) {
        console.error('Error testing tournament creation:', error);
    }
}

testTournamentCreation();
