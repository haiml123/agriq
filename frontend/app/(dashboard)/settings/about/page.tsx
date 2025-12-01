'use client';

import { Badge } from '@/components/ui/badge';
import { Info, Server, Database, Shield } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">About</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Platform information and version details
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Info className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">AgriQ Platform</h2>
                            <p className="text-sm text-muted-foreground">Grain Storage Management</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Version</span>
                            <Badge variant="outline">1.0.0</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Environment</span>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                Production
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Last Updated</span>
                            <span className="text-sm text-foreground">November 30, 2025</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Server className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">System Status</h2>
                            <p className="text-sm text-muted-foreground">Current service health</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">API Status</span>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                Operational
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Database</span>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                Connected
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Sensor Network</span>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                Active
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Database className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Data Statistics</h2>
                            <p className="text-sm text-muted-foreground">Platform usage metrics</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Organizations</span>
                            <span className="text-sm font-medium text-foreground">3</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total Sites</span>
                            <span className="text-sm font-medium text-foreground">10</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Active Sensors</span>
                            <span className="text-sm font-medium text-foreground">156</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Security</h2>
                            <p className="text-sm text-muted-foreground">Security information</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Encryption</span>
                            <span className="text-sm font-medium text-foreground">AES-256</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">SSL/TLS</span>
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                Enabled
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Last Audit</span>
                            <span className="text-sm font-medium text-foreground">Oct 15, 2025</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-2">Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Need help? Contact our support team for assistance.
                </p>
                <div className="flex gap-4">
                    <a
                        href="mailto:support@agriq.farm"
                        className="text-sm text-primary hover:underline"
                    >
                        support@agriq.farm
                    </a>
                    <span className="text-muted-foreground">|</span>
                    <a
                        href="https://docs.agriq.farm"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                    >
                        Documentation
                    </a>
                </div>
            </div>
        </div>
    );
}
