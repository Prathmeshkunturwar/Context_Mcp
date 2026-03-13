import { SemanticRanker } from './src/ranking/semantic-ranker';

async function run() {
    console.log('Initializing Vector Embeddings...');
    const ranker = new SemanticRanker();

    const chunks = [
        { title: 'Apples', content: 'A sweet red or green fruit that grows on an apple tree.', sourceFiles: [] },
        { title: 'Airplanes', content: 'A powered flying vehicle with fixed wings and a weight greater than that of the air it displaces.', sourceFiles: [] },
        { title: 'The Matrix', content: 'A 1999 science fiction action film written and directed by the Wachowskis.', sourceFiles: [] }
    ];

    console.log('Ranking chunks for query: "fruit"');
    const rankedVec1 = await ranker.rankChunks('fruit', chunks);
    console.log('Top match for Fruit:', rankedVec1[0].title); // Should be Apples

    console.log('Ranking chunks for query: "aviation"');
    const rankedVec2 = await ranker.rankChunks('aviation', chunks);
    console.log('Top match for Aviation:', rankedVec2[0].title); // Should be Airplanes

    console.log('Ranking chunks for query: "movies and cinema"');
    const rankedVec3 = await ranker.rankChunks('movies and cinema', chunks);
    console.log('Top match for Cinema:', rankedVec3[0].title); // Should be The Matrix
}

run().catch(console.error);
