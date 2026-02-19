'use client';
import { ExperimentProvider, useExperimentContext } from '../context/ExperimentContext';
import Header from '../components/Header';
import Methodology from '../components/Methodology';
import ExperimentRunner from '../components/ExperimentRunner';
import ResultsDashboard from '../components/ResultsDashboard';
import DataExport from '../components/DataExport';
import MethodologyNotes from '../components/MethodologyNotes';

function PageContent() {
  const { state } = useExperimentContext();

  return (
    <main className="min-h-screen">
      <Header />
      <div className="border-t border-bg-tertiary" />
      <Methodology />
      <div className="border-t border-bg-tertiary" />
      <ExperimentRunner />
      {state.status === 'complete' && state.results && (
        <>
          <div className="border-t border-bg-tertiary" />
          <ResultsDashboard results={state.results} />
          <div className="border-t border-bg-tertiary" />
          <DataExport results={state.results} />
        </>
      )}
      <div className="border-t border-bg-tertiary" />
      <MethodologyNotes />
      <footer className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-xs font-mono text-text-muted">
          Built with Next.js &middot; Simulation engine ported from Evolution Simulator by MinuteLabs
        </p>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <ExperimentProvider>
      <PageContent />
    </ExperimentProvider>
  );
}
