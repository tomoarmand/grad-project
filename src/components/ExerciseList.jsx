import { useState, useEffect } from "react";

function ExerciseList({ exercises, onDelete}) {

    return (
        <>
        <h2>Saved Exercises</h2>
        {exercises.length === 0 && <p>No exercises saved yet...</p>}
        <ul>
            {exercises.map((ex) => (
                <li key={ex._id}>
                <p>Answer: {ex.correctAnswer}</p>
                <audio controls src={ex.audioData}></audio>
                <button onClick={() => onDelete(ex._id)}>Delete</button>
                </li>
            ))
            }
        </ul>
        </>
    )
}

export default ExerciseList